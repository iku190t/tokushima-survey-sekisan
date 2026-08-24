"""Create the public web積算 introduction video from anonymous UI captures."""

from __future__ import annotations

import os
import subprocess
import sys
import wave
from pathlib import Path

import imageio.v2 as imageio
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "media" / "intro-assets"
OUTPUT = ROOT / "media" / "web-sekisan-introduction.mp4"
SILENT_OUTPUT = ROOT / "media" / "web-sekisan-introduction-silent.mp4"
THUMBNAIL = ROOT / "media" / "web-sekisan-introduction-thumbnail.jpg"
NARRATION = ASSETS / "narration.wav"
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
    draw.rounded_rectangle((left, y, right, bottom), radius=22, fill=(14, 45, 37, 235))
    text_left = left + 34
    if number:
        draw.ellipse((left + 26, y + 26, left + 82, y + 82), fill=LIME)
        draw.text((left + 54, y + 54), number, font=font(26, True), fill=INK, anchor="mm")
        text_left = left + 106
    draw.text((text_left, y + 24), title, font=font(30, True), fill="white")
    draw.text((text_left, y + 72), body, font=font(21), fill=(229, 239, 235, 255))


def fit_screen(path: Path, progress: float = 0.0) -> Image.Image:
    source = Image.open(path).convert("RGB")
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
    draw.rounded_rectangle((82, 98, 174, 190), radius=22, fill=LIME)
    draw.text((128, 145), "Σ", font=font(59, True), fill=GREEN, anchor="mm")
    draw.text((82, 240), "web積算", font=font(70, True), fill="white")
    draw.text((86, 344), "測量・設計・調査計画・地質を、ひとつの画面で。", font=font(31), fill="#dce9e4")
    draw.rounded_rectangle((82, 422, 670, 492), radius=35, fill=(214, 239, 106, 245))
    draw.text((376, 457), "国土交通省・全国標準  令和6〜8年度", font=font(25, True), fill=INK, anchor="mm")
    draw.text((84, 616), "参考試算用・公式ソフトではありません", font=font(19), fill=(218, 231, 226, 230))
    return image


def screenshot_frame(path: Path, title: str, body: str, number: str, progress: float) -> Image.Image:
    image = fit_screen(path, progress)
    veil = Image.new("RGBA", image.size, (9, 34, 28, 0))
    vdraw = ImageDraw.Draw(veil)
    vdraw.rectangle((0, 0, WIDTH, 105), fill=(13, 53, 42, 190))
    image = Image.alpha_composite(image.convert("RGBA"), veil).convert("RGB")
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((56, 50), "web積算  |  便利な機能", font=font(24, True), fill="white", anchor="lm")
    rounded_text_box(image, title, body, number=number)
    return image


def import_workflow_frame(path: Path, title: str, body: str, number: str, progress: float) -> Image.Image:
    image = fit_screen(path, progress)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rounded_rectangle((42, 25, 1238, 118), radius=18, fill=(15, 55, 44, 235))
    draw.ellipse((70, 44, 126, 100), fill=LIME)
    draw.text((98, 72), number, font=font(24, True), fill=INK, anchor="mm")
    draw.text((148, 49), title, font=font(31, True), fill="white")
    draw.text((150, 87), body, font=font(18), fill="#dce9e4")
    return image


def end_frame(progress: float) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), OFF_WHITE)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rectangle((0, 0, WIDTH, 185), fill=GREEN)
    draw.rounded_rectangle((74, 51, 150, 127), radius=18, fill=LIME)
    draw.text((112, 89), "Σ", font=font(47, True), fill=GREEN, anchor="mm")
    draw.text((180, 91), "web積算", font=font(50, True), fill="white", anchor="lm")
    draw.text((WIDTH / 2, 286), "積算の入口を、もっと分かりやすく。", font=font(42, True), fill=INK, anchor="mm")
    draw.rounded_rectangle((178, 355, WIDTH - 178, 447), radius=18, fill="white", outline=(23, 79, 63, 90), width=2)
    draw.text((WIDTH / 2, 401), "iku190t.github.io/tokushima-survey-sekisan/", font=font(28, True), fill=GREEN, anchor="mm")
    draw.text((WIDTH / 2, 520), "無料公開  |  入力資料は外部送信しません", font=font(25), fill="#48645b", anchor="mm")
    draw.text((WIDTH / 2, 637), "必ず発注者適用基準・特記仕様・正解積算と照合してください", font=font(19), fill="#6c7a75", anchor="mm")
    return image


SCENES = [
    (3.5, title_frame),
    (5.5, lambda p: screenshot_frame(ASSETS / "01-design.png", "4つの業務をタブで切替", "設計・測量・調査計画・地質を、共通レイアウトで迷わず操作。", "1", p)),
    (5.5, lambda p: screenshot_frame(ASSETS / "02-survey.png", "キーワードから素早く選択", "基準点、水準、UAV・レーザなどを一覧から絞り込み。", "2", p)),
    (6.5, lambda p: screenshot_frame(ASSETS / "03-calculation.png", "数量を入れると自動積算", "単位・入力桁を項目ごとに制限し、内訳と合計を即時再計算。", "3", p)),
    (4.8, lambda p: import_workflow_frame(ASSETS / "04-import-loaded.png", "匿名PDFを実際に読み込み", "文字入りPDFをブラウザー内で直接抽出。案件資料そのものは外部送信しません。", "4", p)),
    (4.8, lambda p: import_workflow_frame(ASSETS / "04-import-drag-item-quantity.png", "項目名と数量をドラッグ", "PDFの文字枠を、横の緑枠にポチポチ移して対応付けます。", "5", p)),
    (4.8, lambda p: import_workflow_frame(ASSETS / "04-import-drag-complete.png", "単位もドラッグして確認", "項目・数量・単位がそろったら、換算結果を確認して反映待ちへ追加。", "6", p)),
    (4.3, lambda p: import_workflow_frame(ASSETS / "04-import-pending.png", "同じ画面で続けて追加", "積算画面へ戻らず、次のPDF行を連続して処理できます。", "7", p)),
    (5.5, lambda p: screenshot_frame(ASSETS / "05-master.png", "令和6〜8年度を切替", "全国標準の歩掛・技術者単価・経費率を年度別に管理。", "8", p)),
    (5.5, lambda p: screenshot_frame(ASSETS / "06-reports.png", "提出用帳票をPDFへ", "見積書・積算内訳・計算根拠をA4書式でまとめて出力。", "9", p)),
    (4.5, end_frame),
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
    narration_script = ROOT / "tools" / "create-intro-narration.ps1"
    pwsh = Path.home() / ".cache" / "codex-runtimes" / "codex-primary-runtime" / "dependencies" / "native" / "powershell" / "pwsh.exe"
    if not pwsh.exists():
        pwsh = Path("powershell.exe")
    subprocess.run([
        str(pwsh), "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(narration_script), "-OutputPath", str(NARRATION)
    ], check=True)
    create_original_music(duration)
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run([
        ffmpeg, "-y", "-i", str(SILENT_OUTPUT), "-i", str(NARRATION), "-i", str(MUSIC),
        "-filter_complex", "[1:a]volume=0.95[n];[2:a]volume=0.38[m];[n][m]amix=inputs=2:duration=longest:normalize=0[a]",
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
    thumbnail = screenshot_frame(ASSETS / "04-import-drag-complete.png", "PDFから、積算・内訳・帳票まで。", "音声・BGM付きで便利な機能を紹介", "Σ", 0.35)
    thumbnail.save(THUMBNAIL, quality=92, subsampling=0)
    print(f"Created: {OUTPUT} ({OUTPUT.stat().st_size} bytes)")
    print(f"Duration: {duration:.2f} seconds with narration and original BGM")
    print(f"Created: {THUMBNAIL} ({THUMBNAIL.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
