"""Create a calm, natural Japanese narration for the public feature video."""

from __future__ import annotations

import argparse
import asyncio
import re
import subprocess
import tempfile
from pathlib import Path

import edge_tts
import imageio_ffmpeg


VOICE = "ja-JP-NanamiNeural"
RATE = "+5%"
PITCH = "-2Hz"
SCENE_STARTS = [0.7, 9.55, 20.0, 30.45, 42.9, 52.85, 62.8, 72.75, 82.7, 103.6]

# Keep each thought short. Edge TTS then speaks one idea at a time instead of
# squeezing a long paragraph into a single, machine-like breath.
SEGMENTS = [
    "積算は、項目を探すところから大変です。Web積算なら、設計、測量、調査計画、地質を、ひとつの画面で整理できます。",
    "キーワードを押すと候補を絞れます。作業区分、作業項目、数量を、どの業務でも同じ順番で入力します。",
    "測量は、基準点、水準、現地、UAV、レーザーまで一覧から選択。項目に合った単位と入力桁で、入力ミスを防ぎます。",
    "数量と条件を入れると、内訳と合計をすぐに再計算。現場条件は次の項目へ引き継ぎ、手動で変えた値を最優先にします。",
    "PDFから始めるときは、資料をそのまま読み込みます。ここでは匿名の紹介用PDFを使います。",
    "PDFの作業項目を、右の欄へドラッグ。数量や単位が分からなくても、項目だけ先に追加できます。",
    "数量と単位がそろえば入力完了。未入力の行も区別されるので、どこまで作業したか迷いません。",
    "明細では、数量換算、補正条件、計算式、出典資料を一か所で確認。確認できない項目を、無理に金額へ置き換えません。",
    "令和6年度から令和8年度を切り替え、見積書、積算内訳、計算根拠をPDF出力。会社情報は次回も使えます。",
    "選ぶ。確認する。帳票にする。積算の流れを、ひとつの画面で。Web積算です。",
]


async def synthesize(output_path: Path) -> None:
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="web-sekisan-voice-") as temp_name:
        temp_dir = Path(temp_name)
        parts: list[Path] = []
        for index, text in enumerate(SEGMENTS, start=1):
            part = temp_dir / f"voice-{index:02d}.mp3"
            await edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH).save(str(part))
            parts.append(part)

        durations: list[float] = []
        for part in parts:
            probe = subprocess.run(
                [ffmpeg, "-hide_banner", "-i", str(part), "-f", "null", "NUL"],
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                text=True,
                encoding="utf-8",
                errors="replace",
            )
            match = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", probe.stderr)
            if not match:
                raise RuntimeError(f"Could not read narration duration: {part}")
            hours, minutes, seconds = match.groups()
            durations.append(int(hours) * 3600 + int(minutes) * 60 + float(seconds))

        placements: list[float] = []
        cursor = 0.0
        for desired, duration in zip(SCENE_STARTS, durations, strict=True):
            start = max(desired, cursor)
            placements.append(start)
            cursor = start + duration + 0.32

        filters = []
        inputs = [ffmpeg, "-y"]
        for index, part in enumerate(parts):
            inputs.extend(["-i", str(part)])
            delay = round(placements[index] * 1000)
            filters.append(f"[{index}:a]adelay={delay}:all=1[v{index}]")
        joined = "".join(f"[v{index}]" for index in range(len(parts)))
        filters.append(f"{joined}amix=inputs={len(parts)}:duration=longest:normalize=0,alimiter=limit=0.95[out]")
        subprocess.run(
            inputs
            + [
                "-filter_complex",
                ";".join(filters),
                "-map",
                "[out]",
                "-ar",
                "24000",
                "-ac",
                "1",
                "-b:a",
                "64k",
                str(output_path),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        for index, (start, duration) in enumerate(zip(placements, durations, strict=True), start=1):
            print(f"  segment {index:02d}: {start:6.2f}s - {start + duration:6.2f}s")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    asyncio.run(synthesize(args.output.resolve()))
    print(f"Created natural narration: {args.output}")


if __name__ == "__main__":
    main()
