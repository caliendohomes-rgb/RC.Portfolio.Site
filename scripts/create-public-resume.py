"""Create a public-safe copy of Richard's supplied resume without flattening it."""

import argparse
import re
from pathlib import Path

import pymupdf


ROOT = Path(__file__).resolve().parents[1]
BODY = (30 / 255, 30 / 255, 30 / 255)
GOLD = (138 / 255, 106 / 255, 43 / 255)
MUTED = (90 / 255, 90 / 255, 90 / 255)
PANEL = (247 / 255, 242 / 255, 232 / 255)


def draw_wrapped(page, bold_font, regular_font, lead, rest, baseline, max_lines):
    words = [(word, bold_font) for word in lead.split()]
    words += [(word, regular_font) for word in rest.split()]
    lines = [[]]
    width = 0
    for word, font in words:
        space = font.text_length(" ", fontsize=10) if lines[-1] else 0
        word_width = font.text_length(word, fontsize=10)
        if width + space + word_width > 510 and lines[-1]:
            lines.append([])
            width = 0
            space = 0
        lines[-1].append((word, font, space))
        width += space + word_width
    if len(lines) > max_lines:
        raise ValueError(f"Replacement needs {len(lines)} lines, only {max_lines} fit")
    for line_number, line in enumerate(lines):
        x = 57.6
        y = baseline + line_number * 12.95
        for word, font, space in line:
            x += space
            page.insert_text(
                (x, y), word, fontsize=10,
                fontname="ResumeBold" if font is bold_font else "ResumeRegular",
                color=BODY,
            )
            x += font.text_length(word, fontsize=10)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, help="Original resume supplied by Richard")
    parser.add_argument(
        "--output", type=Path, default=ROOT / "Richard_Caliendo_Resume.pdf"
    )
    args = parser.parse_args()
    doc = pymupdf.open(args.source)
    if len(doc) != 2:
        raise ValueError("Expected the supplied two-page resume")
    source_text = "\n".join(page.get_text() for page in doc)
    for phrase in ("Staff Technical Program Manager", "multi-agent desktop orchestration app", "StandardCraft"):
        if phrase not in source_text:
            raise ValueError(f"Unexpected source resume: missing {phrase}")

    font_dir = ROOT / "scripts" / "fonts"
    regular_bytes = (font_dir / "EBGaramond-Regular.ttf").read_bytes()
    bold_bytes = (font_dir / "EBGaramond-Bold.ttf").read_bytes()
    regular = pymupdf.Font(fontbuffer=regular_bytes)
    bold = pymupdf.Font(fontbuffer=bold_bytes)
    first, second = doc
    for rect, fill in (
        ((437.8, 100, 569.45, 137.65), PANEL),
        ((57.5, 587.1, 571, 640.7), (1, 1, 1)),
        ((57.5, 654.4, 569, 695.0), (1, 1, 1)),
        ((227.5, 306.4, 326, 321.0), (1, 1, 1)),
    ):
        first.add_redact_annot(pymupdf.Rect(rect), fill=fill, cross_out=False)
    for rect in (
        (57.5, 33.8, 558, 74.5),
        (345.3, 527.3, 558, 540.5),
    ):
        second.add_redact_annot(pymupdf.Rect(rect), fill=(1, 1, 1), cross_out=False)
    first.apply_redactions(images=0, graphics=0)
    second.apply_redactions(images=0, graphics=0)
    for page in doc:
        page.insert_font(fontname="ResumeRegular", fontbuffer=regular_bytes)
        page.insert_font(fontname="ResumeBold", fontbuffer=bold_bytes)

    title = "FY26"
    first.insert_text(
        (503.6 - bold.text_length(title, fontsize=15) / 2, 119.55),
        title, fontname="ResumeBold", fontsize=15, color=GOLD,
    )
    label = "REVENUE PROGRAMS"
    first.insert_text(
        (503.6 - regular.text_length(label, fontsize=7) / 2, 131.1),
        label, fontname="ResumeRegular", fontsize=7, color=MUTED,
    )
    draw_wrapped(
        first, bold, regular,
        "Measured AI impact without a velocity baseline.",
        "Designed a framework using Atlassian Rovo agents and Claude via MCP to cross-analyze Jira telemetry across Product and Engineering teams against AI tool usage. Rolled findings into executive ROI models that informed multi-million-dollar funding decisions.",
        597.75, 4,
    )
    draw_wrapped(
        first, bold, regular,
        "Governing the Unified Cyber Resilience Portal from alpha toward GA.",
        "Alpha announced at Kaseya Connect in H1 2026, followed by early access in June 2026. Coordinating Product and Engineering execution and release readiness.",
        665.0, 3,
    )
    first.insert_text(
        (227.65, 316.95), "Launch Readiness",
        fontname="ResumeRegular", fontsize=10, color=BODY,
    )
    draw_wrapped(
        second, bold, regular,
        "Program-managed H1 strategic initiatives targeting multi-million-dollar FY26 revenue impact",
        "across churn reduction, evergreen, and customer reactivation; partnered with Boston Consulting Group and executive leadership on Backup portfolio analysis, repositioning, and pricing.",
        44.35, 3,
    )
    second.insert_text(
        (345.4, 537.9), "launch governance, dependency mapping, release",
        fontname="ResumeRegular", fontsize=10, color=BODY,
    )
    doc.set_metadata({**doc.metadata, "title": "Richard Caliendo | Public Resume"})
    doc.save(args.output, garbage=4, deflate=True, clean=True)
    doc.close()
    with pymupdf.open(args.output) as public:
        text = "\n".join(page.get_text() for page in public)
        if len(public) != 2 or "Staff Technical Program Manager" not in text:
            raise ValueError("Public resume lost its layout or current title")
        if re.search(r"\$|\d+(?:\.\d+)?%|\bQ4\b|\bpilot\b|\bNPI\b", text, re.I):
            raise ValueError("Public resume still contains withheld details")
    print(f"Created public-safe resume: {args.output}")


if __name__ == "__main__":
    main()
