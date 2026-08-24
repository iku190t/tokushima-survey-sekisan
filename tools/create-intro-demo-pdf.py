"""Create the anonymous PDF used in the web積算 introduction video."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "media" / "intro-assets" / "web-sekisan-demo.pdf"
FONT_PATH = Path(r"C:\Windows\Fonts\YuGothM.ttc")
FONT_BOLD_PATH = Path(r"C:\Windows\Fonts\YuGothB.ttc")


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("YuGothic", str(FONT_PATH)))
    pdfmetrics.registerFont(TTFont("YuGothicBold", str(FONT_BOLD_PATH)))
    styles = {
        "title": ParagraphStyle("title", fontName="YuGothicBold", fontSize=15, leading=22, alignment=TA_CENTER, textColor=colors.HexColor("#153f34")),
        "sub": ParagraphStyle("sub", fontName="YuGothic", fontSize=9, leading=14, alignment=TA_CENTER, textColor=colors.HexColor("#52665f")),
        "cell": ParagraphStyle("cell", fontName="YuGothic", fontSize=9.5, leading=13),
        "head": ParagraphStyle("head", fontName="YuGothicBold", fontSize=9.5, leading=13, alignment=TA_CENTER),
    }
    doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=18 * mm, bottomMargin=18 * mm, title="web積算 匿名実演用 業務数量総括表", author="株式会社アイズ測量")
    story = [
        Paragraph("業 務 数 量 総 括 表", styles["title"]),
        Spacer(1, 5 * mm),
        Paragraph("令和8年度 ○○地区基準点・用地測量業務", styles["title"]),
        Paragraph("紹介動画用に作成した匿名の架空資料です。実案件・顧客データは含みません。", styles["sub"]),
        Spacer(1, 7 * mm),
    ]
    data = [
        [Paragraph("費目／工種／種別／細別／規格", styles["head"]), Paragraph("単位", styles["head"]), Paragraph("数量", styles["head"]), Paragraph("摘要", styles["head"])],
        [Paragraph("2級基準点測量　新点10点　伐採有り", styles["cell"]), Paragraph("点", styles["cell"]), Paragraph("20", styles["cell"]), Paragraph("基準点測量", styles["cell"])],
        [Paragraph("用地測量　復元測量", styles["cell"]), Paragraph("10,000m²", styles["cell"]), Paragraph("6.9", styles["cell"]), Paragraph("69,000m²相当", styles["cell"])],
        [Paragraph("用地測量　境界確認", styles["cell"]), Paragraph("10,000m²", styles["cell"]), Paragraph("6.9", styles["cell"]), Paragraph("耕地・森林", styles["cell"])],
    ]
    table = Table(data, colWidths=[95 * mm, 25 * mm, 22 * mm, 32 * mm], rowHeights=[14 * mm, 18 * mm, 18 * mm, 18 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8f2ed")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#153f34")),
        ("FONTNAME", (0, 0), (-1, -1), "YuGothic"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 1), (2, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.8, colors.HexColor("#263b34")),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(table)
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("操作例：PDF上の項目名・数量・単位を、それぞれ画面横の緑枠へドラッグして確認後に反映します。", styles["sub"]))
    doc.build(story)
    print(f"Created: {OUTPUT} ({OUTPUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
