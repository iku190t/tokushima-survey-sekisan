(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DocumentReader = api;
})(typeof self !== "undefined" ? self : this, function (root) {
  "use strict";

  const PDF_MODULE = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
  const PDF_WORKER = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
  const TESSERACT_SCRIPT = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
  const TESSERACT_WORKER = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js";
  const TESSERACT_CORE = "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1";
  const TESSERACT_LANG = "https://tessdata.projectnaptha.com/4.0.0";
  const MAX_FILE_BYTES = 30 * 1024 * 1024;
  const MAX_PAGES = 60;

  function report(callback, message, progress = null) {
    if (typeof callback === "function") callback({ message, progress });
  }

  function textItemsToLines(items) {
    const rows = [];
    (items || []).forEach((item) => {
      const text = String(item.str || "").trim();
      if (!text) return;
      const x = Number(item.transform?.[4]) || 0;
      const y = Number(item.transform?.[5]) || 0;
      let row = rows.find((entry) => Math.abs(entry.y - y) <= 2.5);
      if (!row) { row = { y, cells: [] }; rows.push(row); }
      row.cells.push({ x, text });
    });
    return rows.sort((a, b) => b.y - a.y)
      .map((row) => row.cells.sort((a, b) => a.x - b.x).map((cell) => cell.text).join(" ").replace(/\s+/g, " ").trim())
      .filter(Boolean).join("\n");
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-document-reader="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === "true") resolve();
        else existing.addEventListener("load", resolve, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.documentReader = src;
      script.addEventListener("load", () => { script.dataset.loaded = "true"; resolve(); }, { once: true });
      script.addEventListener("error", () => reject(new Error("OCRプログラムを取得できませんでした。ネット接続を確認するか、原文貼付けを使用してください。")), { once: true });
      document.head.appendChild(script);
    });
  }

  async function createOcrWorker(onStatus) {
    if (!root.Tesseract) await loadScript(TESSERACT_SCRIPT);
    report(onStatus, "日本語OCRを準備しています…", 0);
    return root.Tesseract.createWorker(["jpn", "eng"], 1, {
      workerPath: TESSERACT_WORKER,
      corePath: TESSERACT_CORE,
      langPath: TESSERACT_LANG,
      logger: (message) => {
        if (message?.status === "recognizing text") report(onStatus, "OCRで文字を読み取っています…", Number(message.progress) || 0);
      }
    });
  }

  async function renderPage(page) {
    const original = page.getViewport({ scale: 1 });
    const maxDimension = 2600;
    const scale = Math.min(2.2, maxDimension / Math.max(original.width, original.height));
    const viewport = page.getViewport({ scale: Math.max(1.35, scale) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas;
  }

  function assertFile(file) {
    if (!file) throw new Error("ファイルが選択されていません。");
    if (file.size > MAX_FILE_BYTES) throw new Error("30MBを超える資料は読み込めません。分割して取り込んでください。");
    const type = String(file.type || "").toLowerCase();
    const extension = String(file.name || "").toLowerCase().split(".").pop();
    if (!type.includes("pdf") && !type.startsWith("image/") && !["pdf", "png", "jpg", "jpeg", "webp"].includes(extension)) {
      throw new Error("PDF、PNG、JPEG、WebPのいずれかを選択してください。");
    }
  }

  async function readPdf(file, onStatus) {
    report(onStatus, "PDFの文字情報を確認しています…", 0);
    let pdfjs;
    try { pdfjs = await import(PDF_MODULE); }
    catch (_) { throw new Error("PDF解析プログラムを取得できませんでした。ネット接続を確認するか、原文貼付けを使用してください。"); }
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER;
    const data = new Uint8Array(await file.arrayBuffer());
    const documentTask = pdfjs.getDocument({
      data,
      isEvalSupported: false,
      cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/"
    });
    const pdf = await documentTask.promise;
    if (pdf.numPages > MAX_PAGES) throw new Error(`全${pdf.numPages}ページです。安全のため1回60ページ以下に分割してください。`);
    const pages = [];
    let ocrWorker = null;
    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        report(onStatus, `PDF ${pageNumber}/${pdf.numPages}ページを解析しています…`, (pageNumber - 1) / pdf.numPages);
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent({ includeMarkedContent: false });
        let text = textItemsToLines(content.items);
        let method = "text";
        if (text.replace(/\s/g, "").length < 20) {
          if (!ocrWorker) ocrWorker = await createOcrWorker(onStatus);
          const canvas = await renderPage(page);
          const result = await ocrWorker.recognize(canvas, { rotateAuto: true });
          text = String(result?.data?.text || "").trim();
          method = "ocr";
          canvas.width = 1;
          canvas.height = 1;
        }
        pages.push({ pageNumber, text, method });
        page.cleanup();
      }
    } finally {
      if (ocrWorker) await ocrWorker.terminate();
      await pdf.destroy();
    }
    return pages;
  }

  async function readImage(file, onStatus) {
    const worker = await createOcrWorker(onStatus);
    try {
      report(onStatus, "写真をOCRで解析しています…", 0.05);
      const result = await worker.recognize(file, { rotateAuto: true });
      return [{ pageNumber: 1, text: String(result?.data?.text || "").trim(), method: "ocr" }];
    } finally {
      await worker.terminate();
    }
  }

  async function read(file, onStatus) {
    assertFile(file);
    const isPdf = String(file.type || "").toLowerCase().includes("pdf") || String(file.name || "").toLowerCase().endsWith(".pdf");
    const pages = isPdf ? await readPdf(file, onStatus) : await readImage(file, onStatus);
    report(onStatus, "資料の読取りが完了しました。抽出候補を確認してください。", 1);
    return { fileName: file.name, fileSize: file.size, pages };
  }

  return { read, textItemsToLines, constants: { MAX_FILE_BYTES, MAX_PAGES } };
});
