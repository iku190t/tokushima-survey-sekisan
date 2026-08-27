"""Create the public web積算 introduction video from anonymous UI captures."""

from __future__ import annotations

import subprocess
import sys
import wave
from pathlib import Path

import imageio.v2 as imageio
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "media" / "intro-assets"
APP_ICON = ROOT / "assets" / "icon-concepts" / "web-sekisan-icon-04.png"
OUTPUT = ROOT / "media" / "web-sekisan-introduction.mp4"
SILENT_OUTPUT = ROOT / "media" / "web-sekisan-introduction-silent.mp4"
THUMBNAIL = ROOT / "media" / "web-sekisan-introduction-thumbnail.jpg"
NARRATION = ASSETS / "narration-natural.mp3"
MUSIC = ASSETS / "original-bgm.wav"
WIDTH, HEIGHT, FPS = 1280, 720, 24
GREEN = "#174f3f"
LIME = "#d6ef6a"
INK = "#10251f"
OFF_WHITE = "#f4f7f3"
FONT_BOLD_PATH = Path(r"C:\Windows\Fonts\YuGothB.ttc")
FONT_MEDIUM_PATH = Path(r"C:\Windows\Fonts\YuGothM.ttc")


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = FONT_BOLD_PATH if bold else FONT_MEDIUM_PATH
    return ImageFont.truetype(str(path), size=size)


def paste_app_icon(image: Image.Image, box: tuple[int, int, int, int]) -> None:
    """Place the selected no. 4 shortcut icon without the old sigma ornament."""
    icon = Image.open(APP_ICON).convert("RGBA")
    icon.thumbnail((box[2] - box[0], box[3] - box[1]), Image.Resampling.LANCZOS)
    left = box[0] + ((box[2] - box[0]) - icon.width) // 2
    top = box[1] + ((box[3] - box[1]) - icon.height) // 2
    image.paste(icon, (left, top), icon)


def rounded_text_box(
    image: Image.Image,
    title: str,
    body: str,
    *,
    number: str | None = None,
    y: int = 515,
) -> None:
    draw = ImageDraw.Draw(image, "RGBA")
    left, right, bottom = 56, WIDTH - 56, HEIGHT - 42
    draw.rounded_rectangle((left, y, right, bottom), radius=22, fill=(10, 43, 35, 242))
    text_left = left + 34
    if number:
        draw.ellipse((left + 26, y + 26, left + 82, y + 82), fill=LIME)
        draw.text((left + 54, y + 54), number, font=font(26, True), fill=INK, anchor="mm")
        text_left = left + 106
    draw.text((text_left, y + 23), title, font=font(31, True), fill="white")
    draw.text((text_left, y + 73), body, font=font(22), fill=(229, 239, 235, 255))


def draw_timeline(image: Image.Image, chapter: int, progress: float) -> None:
    """Add a restrained chapter marker so the viewer always knows the flow."""
    draw = ImageDraw.Draw(image, "RGBA")
    left, right = 56, WIDTH - 56
    y = 686
    draw.rounded_rectangle((left, y, right, y + 7), radius=4, fill=(255, 255, 255, 100))
    overall = min(1.0, max(0.0, (chapter - 1 + progress) / 6.0))
    draw.rounded_rectangle((left, y, left + int((right - left) * overall), y + 7), radius=4, fill=LIME)
    draw.text((right, 665), f"{chapter} / 6", font=font(17, True), fill=(236, 244, 241, 230), anchor="rs")


def fit_screen(path: Path, progress: float = 0.0) -> Image.Image:
    source = Image.open(path).convert("RGB")
    if path.name in {"01-design.png", "02-survey.png", "03-calculation.png"}:
        # The current public UI no longer displays the old収録件数 badge.
        clean = ImageDraw.Draw(source)
        clean.rounded_rectangle((790, 347, 879, 388), radius=12, fill="#ffffff")
    source_ratio = source.width / source.height
    target_ratio = WIDTH / HEIGHT
    zoom = 1.0 + 0.025 * progress
    if source_ratio > target_ratio:
        crop_height = source.height / zoom
        crop_width = crop_height * target_ratio
    else:
        crop_width = source.width / zoom
        crop_height = crop_width / target_ratio
    left = (source.width - crop_width) / 2
    top = (source.height - crop_height) / 2
    cropped = source.crop((left, top, left + crop_width, top + crop_height))
    return cropped.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)


def title_frame(progress: float) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), GREEN)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.ellipse((875, -180, 1390, 335), outline=(214, 239, 106, 60), width=2)
    draw.ellipse((955, -100, 1310, 255), outline=(214, 239, 106, 90), width=2)
    paste_app_icon(image, (67, 70, 190, 193))
    draw.rounded_rectangle((82, 218, 310, 268), radius=25, fill=(255, 255, 255, 30), outline=(214, 239, 106, 180), width=2)
    draw.text((196, 243), "要点だけ、約2分", font=font(21, True), fill=LIME, anchor="mm")
    draw.text((82, 302), "web積算", font=font(72, True), fill="white")
    draw.text((86, 404), "選ぶ・確認する・帳票にする。", font=font(36, True), fill="#dce9e4")
    draw.text((86, 462), "設計・測量・調査計画・地質を、ひとつの画面で。", font=font(27), fill="#dce9e4")
    draw.rounded_rectangle((82, 535, 670, 605), radius=35, fill=(214, 239, 106, 245))
    draw.text((376, 570), "国土交通省・全国標準  令和6〜8年度", font=font(25, True), fill=INK, anchor="mm")
    draw.text((84, 654), "参考試算用・公式ソフトではありません", font=font(18), fill=(218, 231, 226, 230))
    return image


def screenshot_frame(path: Path, title: str, body: str, number: str, eyebrow: str, chapter: int, progress: float) -> Image.Image:
    image = fit_screen(path, progress)
    veil = Image.new("RGBA", image.size, (9, 34, 28, 0))
    vdraw = ImageDraw.Draw(veil)
    vdraw.rectangle((0, 0, WIDTH, 105), fill=(13, 53, 42, 190))
    image = Image.alpha_composite(image.convert("RGBA"), veil).convert("RGB")
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((56, 50), f"web積算  |  {eyebrow}", font=font(24, True), fill="white", anchor="lm")
    rounded_text_box(image, title, body, number=number)
    draw_timeline(image, chapter, progress)
    return image


def import_workflow_frame(path: Path, title: str, body: str, number: str, progress: float) -> Image.Image:
    image = fit_screen(path, progress)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rounded_rectangle((42, 25, 1238, 118), radius=18, fill=(15, 55, 44, 235))
    draw.ellipse((70, 44, 126, 100), fill=LIME)
    draw.text((98, 72), number, font=font(24, True), fill=INK, anchor="mm")
    draw.text((148, 49), title, font=font(31, True), fill="white")
    draw.text((150, 87), body, font=font(18), fill="#dce9e4")
    draw_timeline(image, 4, progress)
    return image


def end_frame(progress: float) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), OFF_WHITE)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rectangle((0, 0, WIDTH, 185), fill=GREEN)
    paste_app_icon(image, (62, 38, 160, 136))
    draw.text((180, 91), "web積算", font=font(50, True), fill="white", anchor="lm")
    draw.text((WIDTH / 2, 270), "ここまで、ひとつの画面で。", font=font(44, True), fill=INK, anchor="mm")
    chips = [("選ぶ", 210), ("確認する", 490), ("帳票にする", 790)]
    for label, left in chips:
        draw.rounded_rectangle((left, 340, left + 245, 414), radius=37, fill="white", outline=(23, 79, 63, 80), width=2)
        draw.text((left + 122, 377), label, font=font(25, True), fill=GREEN, anchor="mm")
    draw.text((WIDTH / 2, 495), "web積算", font=font(48, True), fill=GREEN, anchor="mm")
    draw.text((WIDTH / 2, 558), "iku190t.github.io/tokushima-survey-sekisan/", font=font(24, True), fill="#48645b", anchor="mm")
    draw.text((WIDTH / 2, 640), "確認できた公開資料だけを計算に使用  |  入力資料は外部送信しません", font=font(19), fill="#6c7a75", anchor="mm")
    return image


SCENES = [
    (10.0, title_frame),
    (11.0, lambda p: screenshot_frame(ASSETS / "01-design.png", "4業務を、同じ操作で", "キーワード → 作業区分 → 項目 → 数量。迷わない入力順です。", "1", "01  業務選択", 1, p)),
    (11.0, lambda p: screenshot_frame(ASSETS / "02-survey.png", "探すより、押して絞り込む", "基準点・水準・現地・UAV・レーザーを、キーワードから素早く選択。", "2", "02  項目選択", 2, p)),
    (13.0, lambda p: screenshot_frame(ASSETS / "03-calculation.png", "入力した瞬間、積算結果まで", "単位・入力桁・現場条件を反映し、内訳と合計をすぐに再計算。", "3", "03  自動積算", 3, p)),
    (10.5, lambda p: import_workflow_frame(ASSETS / "04-import-loaded.png", "匿名PDFを、そのまま読み込み", "文字入りPDFをブラウザー内で抽出。資料そのものは外部送信しません。", "1", p)),
    (10.5, lambda p: import_workflow_frame(ASSETS / "04-import-drag-item-quantity.png", "作業項目を、右の欄へドラッグ", "項目だけ先に追加して、数量・単位はあとから入力できます。", "2", p)),
    (10.5, lambda p: import_workflow_frame(ASSETS / "04-import-drag-complete.png", "数量・単位まで、行ごとに確認", "入力完了と数量未入力を色分け。どこまで進んだかが一目で分かります。", "3", p)),
    (10.5, lambda p: import_workflow_frame(ASSETS / "04-import-pending.png", "画面を戻らず、次の行へ", "反映待ちへ追加したら、そのまま次のPDF行を連続処理できます。", "4", p)),
    (11.0, lambda p: screenshot_frame(ASSETS / "05-master.png", "令和6・7・8年度を切替", "全国標準の歩掛・技術者単価・経費率を、年度別に管理。", "5", "05  年度マスター", 5, p)),
    (11.0, lambda p: screenshot_frame(ASSETS / "06-reports.png", "見積書・内訳・根拠をPDFへ", "会社情報を引き継ぎ、提出しやすいA4帳票へまとめます。", "6", "06  帳票出力", 6, p)),
    (18.0, end_frame),
]


def blend(a: Image.Image, b: Image.Image, amount: float) -> Image.Image:
    return Image.blend(a.convert("RGB"), b.convert("RGB"), max(0.0, min(1.0, amount)))


def create_original_music(duration: float) -> None:
    """Generate a calm, original four-chord background track."""
    rate = 44100
    sample_count = int(duration * rate)
    timeline = np.arange(sample_count, dtype=np.float64) / rate
    audio = np.zeros(sample_count, dtype=np.float64)
    chords = [
        (130.81, 164.81, 196.00),
        (110.00, 130.81, 164.81),
        (87.31, 110.00, 130.81),
        (98.00, 123.47, 146.83),
    ]
    bar_seconds = 4.0
    for index, chord in enumerate(chords):
        mask = ((timeline // bar_seconds).astype(int) % len(chords)) == index
        local = timeline % bar_seconds
        envelope = np.minimum(1.0, local / 0.35) * np.minimum(1.0, (bar_seconds - local) / 0.7)
        for note_index, frequency in enumerate(chord):
            audio[mask] += (0.045 / (note_index + 1)) * np.sin(2 * np.pi * frequency * timeline[mask]) * envelope[mask]
    beat = timeline % 1.0
    pluck_env = np.exp(-beat * 5.2)
    audio += 0.025 * np.sin(2 * np.pi * 523.25 * timeline) * pluck_env
    fade = np.minimum(1.0, timeline / 1.2) * np.minimum(1.0, (duration - timeline) / 1.8)
    pcm = np.int16(np.clip(audio * fade, -0.95, 0.95) * 32767)
    stereo = np.column_stack([pcm, np.int16(pcm * 0.94)]).ravel()
    with wave.open(str(MUSIC), "wb") as stream:
        stream.setnchannels(2)
        stream.setsampwidth(2)
        stream.setframerate(rate)
        stream.writeframes(stereo.tobytes())


def add_audio(duration: float) -> None:
    narration_script = ROOT / "tools" / "create-intro-narration.py"
    subprocess.run([
        sys.executable, str(narration_script), "--output", str(NARRATION)
    ], check=True)
    create_original_music(duration)
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run([
        ffmpeg, "-y", "-i", str(SILENT_OUTPUT), "-i", str(NARRATION), "-i", str(MUSIC),
        "-filter_complex", "[1:a]volume=1.0[n];[2:a]volume=0.22[m];[n][m]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.92[a]",
        "-map", "0:v:0", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", str(OUTPUT)
    ], check=True)


def main() -> None:
    if "--audio-only" in sys.argv:
        import imageio_ffmpeg
        if not SILENT_OUTPUT.exists():
            raise FileNotFoundError(f"Missing silent video: {SILENT_OUTPUT}")
        _, duration = imageio_ffmpeg.count_frames_and_secs(str(SILENT_OUTPUT))
        add_audio(duration)
        SILENT_OUTPUT.unlink(missing_ok=True)
        print(f"Created: {OUTPUT} ({OUTPUT.stat().st_size} bytes)")
        print(f"Duration: {duration:.2f} seconds with narration and original BGM")
        return
    missing = [path for path in [ASSETS / f"0{i}-{name}.png" for i, name in enumerate(["design", "survey", "calculation", "import", "master", "reports"], 1)] if not path.exists()]
    if missing:
        raise FileNotFoundError("Missing intro assets: " + ", ".join(map(str, missing)))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    transition_frames = int(0.55 * FPS)
    writer = imageio.get_writer(
        SILENT_OUTPUT,
        fps=FPS,
        codec="libx264",
        quality=8,
        pixelformat="yuv420p",
        macro_block_size=1,
        ffmpeg_log_level="warning",
    )
    previous_tail: list[Image.Image] = []
    written_frames = 0
    try:
        for scene_index, (duration, renderer) in enumerate(SCENES):
            frame_count = int(duration * FPS)
            frames = [renderer(index / max(1, frame_count - 1)) for index in range(frame_count)]
            if previous_tail:
                for index in range(transition_frames):
                    writer.append_data(np.asarray(blend(previous_tail[index], frames[index], (index + 1) / (transition_frames + 1))))
                    written_frames += 1
                frames = frames[transition_frames:]
            keep = frames[-transition_frames:] if scene_index < len(SCENES) - 1 else []
            body = frames[:-transition_frames] if keep else frames
            for frame in body:
                writer.append_data(np.asarray(frame))
                written_frames += 1
            previous_tail = keep
        for frame in previous_tail:
            writer.append_data(np.asarray(frame))
            written_frames += 1
    finally:
        writer.close()
    duration = written_frames / FPS
    add_audio(duration)
    SILENT_OUTPUT.unlink(missing_ok=True)
    thumbnail = screenshot_frame(ASSETS / "04-import-drag-complete.png", "PDFから、積算・内訳・帳票まで。", "約2分で、実際の流れが分かります。", "▶", "操作の流れ", 4, 0.35)
    thumbnail.save(THUMBNAIL, quality=92, subsampling=0)
    print(f"Created: {OUTPUT} ({OUTPUT.stat().st_size} bytes)")
    print(f"Duration: {duration:.2f} seconds with narration and original BGM")
    print(f"Created: {THUMBNAIL} ({THUMBNAIL.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
