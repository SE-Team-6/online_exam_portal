from pathlib import Path
import re
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
ROOT = Path(__file__).resolve().parent.parent
BACKEND_LOG = ROOT / "backend" / "backend-coverage-output.txt"
FRONTEND_LCOV = ROOT / "frontend" / "coverage" / "lcov.info"
OUTPUT = ROOT / "testing" / "reports" / "Combined Code and Branch Coverage Report.pdf"
def read_text(path):
    raw = path.read_bytes()
    if raw.startswith((b"\xff\xfe", b"\xfe\xff")):
        return raw.decode("utf-16", errors="replace")
    return raw.decode("utf-8-sig", errors="replace")
def parse_backend():
    text = read_text(BACKEND_LOG)
    rows = []
    aggregate = None
    for line in text.splitlines():
        if "|" not in line:
            continue
        parts = [part.strip() for part in line.split("|")]
        if len(parts) < 4:
            continue
        values = parts[1:4]
        if not all(re.fullmatch(r"\d+(?:\.\d+)?", value) for value in values):
            continue
        name = re.sub(r"^[^A-Za-z0-9]+", "", parts[0]).strip()
        name = re.sub(r"\s+", " ", name)
        if not name:
            continue
        if name.lower() == "all files":
            aggregate = tuple(values)
        else:
            rows.append((name, *values))
    if not rows or aggregate is None:
        raise RuntimeError(
            "Could not parse backend coverage. Check backend-coverage-output.txt."
        )
    return rows, aggregate

def parse_frontend():
    text = read_text(FRONTEND_LCOV)
    rows = []
    def number(block, key):
        match = re.search(r"(?m)^" + key + r":(\d+)\s*$", block)
        return int(match.group(1)) if match else 0
    for block in text.split("end_of_record"):
        source = re.search(r"(?m)^SF:(.+)$", block)
        if not source:
            continue
        name = source.group(1).strip().replace("\\", "/")
        rows.append({
            "name": name,
            "lf": number(block, "LF"),
            "lh": number(block, "LH"),
            "brf": number(block, "BRF"),
            "brh": number(block, "BRH"),
            "fnf": number(block, "FNF"),
            "fnh": number(block, "FNH"),
        })
    if not rows:
        raise RuntimeError("Could not read frontend LCOV records.")
    return rows
def pct(value):
    return f"{float(value):.2f}%"
def coverage_cell(hit, total):
    if total == 0:
        return "N/A"
    return f"{100 * hit / total:.2f}% ({hit}/{total})"
NAVY = colors.HexColor("#17365D")
BLUE = colors.HexColor("#DCE6F1")
PALE = colors.HexColor("#F3F6FA")
GREY = colors.HexColor("#5B6573")
GRID = colors.HexColor("#C8D0DA")
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="ReportTitle", parent=styles["Title"],
    fontName="Helvetica-Bold", fontSize=21,
    leading=25, textColor=NAVY, alignment=TA_CENTER, spaceAfter=5
))
styles.add(ParagraphStyle(
    name="SubTitle", parent=styles["Normal"],
    fontSize=9, leading=13, textColor=GREY,
    alignment=TA_CENTER, spaceAfter=12
))
styles.add(ParagraphStyle(
    name="Section", parent=styles["Heading2"],
    fontName="Helvetica-Bold", fontSize=13,
    leading=16, textColor=NAVY, spaceBefore=7, spaceAfter=7
))
styles.add(ParagraphStyle(
    name="SmallNote", parent=styles["BodyText"],
    fontSize=8, leading=11, textColor=GREY
))
styles.add(ParagraphStyle(
    name="Cell", parent=styles["BodyText"],
    fontSize=6.5, leading=7.5
))
styles.add(ParagraphStyle(
    name="CellHeader", parent=styles["BodyText"],
    fontName="Helvetica-Bold", fontSize=6.5,
    leading=7.5, textColor=colors.white
))
def make_table(data, widths, header=True, font_size=8):
    table = Table(
        data, colWidths=widths,
        repeatRows=1 if header else 0,
        hAlign="LEFT"
    )
    commands = [
        ("GRID", (0, 0), (-1, -1), 0.35, GRID),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 1.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
    ]
    if header:
        commands += [
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ]
    if len(data) > 1:
        commands.append(("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PALE]))
    commands += [
        ("FONTSIZE", (0, 0), (-1, -1), font_size),
        ("LEADING", (0, 0), (-1, -1), font_size + 1),
    ]
    table.setStyle(TableStyle(commands))
    return table
def footer(canvas, doc):
    canvas.saveState()
    width, _ = landscape(A4)
    canvas.setStrokeColor(GRID)
    canvas.line(18 * mm, 14 * mm, width - 18 * mm, 14 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GREY)
    canvas.drawString(18 * mm, 9 * mm, "Online Exam Portal - QA Coverage Evidence")
    canvas.drawRightString(width - 18 * mm, 9 * mm, f"Page {doc.page}")
    canvas.restoreState()
backend_rows, backend_aggregate = parse_backend()
frontend_rows = parse_frontend()
page_size = landscape(A4)
doc = SimpleDocTemplate(
    str(OUTPUT), pagesize=page_size,
    rightMargin=18 * mm, leftMargin=18 * mm,
    topMargin=15 * mm, bottomMargin=21 * mm,
    title="Combined Code and Branch Coverage Report",
    author="Online Exam Portal - Test Engineer"
)
story = []
# Page 1: Summary and test execution evidence
story.append(Paragraph("Combined Code and Branch Coverage Report", styles["ReportTitle"]))
story.append(Paragraph(
    "Online Exam Portal | Automated backend and frontend coverage evidence",
    styles["SubTitle"]
))
metadata = [
    ["Report date", "15 November 2026", "Tested commit", "0ce4ad7"],
    ["Backend result", "32 passed / 0 failed", "Frontend result", "12 passed / 0 failed"],
    ["Backend test files", "6", "Frontend test files", "4"],
]
story.append(make_table(metadata, [38*mm, 55*mm, 38*mm, 55*mm], header=False))
story.append(Spacer(1, 5 * mm))
story.append(Paragraph("Aggregate coverage", styles["Section"]))
coverage_summary = [
    ["Test target", "Statements", "Branches", "Functions", "Lines"],
    ["Backend (Node native coverage)", "Not separately reported",
     pct(backend_aggregate[1]), pct(backend_aggregate[2]), pct(backend_aggregate[0])],
    ["Frontend (Vitest V8)", "20.77%", "14.61%", "19.60%", "20.18%"],
]
story.append(make_table(
    coverage_summary, [65*mm, 48*mm, 42*mm, 42*mm, 42*mm]
))
story.append(Spacer(1, 3 * mm))
story.append(Paragraph(
    "Backend aggregate: line coverage 76.76%, branch coverage 70.06%, "
    "function coverage 77.27%. Node's native coverage summary did not report "
    "a separate statement percentage.",
    styles["SmallNote"]
))
story.append(Paragraph(
    "Frontend aggregate: statement coverage 20.77%, branch coverage 14.61%, "
    "function coverage 19.60%, and line coverage 20.18%.",
    styles["SmallNote"]
))
story.append(Paragraph("Automated test-file breakdown", styles["Section"]))
test_breakdown = [
    ["Backend test file", "Tests", "Frontend test file", "Tests"],
    ["app.test.js", "9", "questionCsv.test.js", "5"],
    ["attempt.integration.test.js", "7", "ProtectedRoute.test.jsx", "3"],
    ["auth.integration.test.js", "2", "Results.test.jsx", "3"],
    ["jwt.test.js", "6", "QuestionBank.test.jsx", "1"],
    ["password.test.js", "5", "", ""],
    ["rateLimits.test.js", "3", "", ""],
    ["Total", "32", "Total", "12"],
]
story.append(make_table(
    test_breakdown, [85*mm, 18*mm, 85*mm, 18*mm]
))
story.append(Spacer(1, 3 * mm))
story.append(Paragraph(
    "Interpretation: Backend and frontend figures are reported separately. "
    "They use different coverage instrumentation and source sets, so no "
    "combined average or overall percentage is calculated. Coverage indicates "
    "which code was exercised by these automated tests; it does not establish "
    "complete requirement coverage or full-system validation.",
    styles["SmallNote"]
))
# Page 2: Backend file-level detail
story.append(PageBreak())
story.append(Paragraph("Backend file-level coverage", styles["Section"]))
story.append(Paragraph(
    "Source: backend/backend-coverage-output.txt. The percentages below are "
    "from the native Node.js coverage report generated with the 32-test run.",
    styles["SmallNote"]
))
story.append(Spacer(1, 3 * mm))
backend_table = [[
    Paragraph("Backend source file", styles["CellHeader"]),
    Paragraph("Lines %", styles["CellHeader"]),
    Paragraph("Branches %", styles["CellHeader"]),
    Paragraph("Functions %", styles["CellHeader"]),
]]
for name, line_pct, branch_pct, function_pct in backend_rows:
    backend_table.append([
        Paragraph(name, styles["Cell"]),
        pct(line_pct), pct(branch_pct), pct(function_pct)
    ])
story.append(make_table(
    backend_table, [105*mm, 35*mm, 40*mm, 40*mm], font_size=6
))
# Page 3: Frontend file-level detail
story.append(PageBreak())
story.append(Paragraph("Frontend file-level coverage", styles["Section"]))
story.append(Paragraph(
    "Source: frontend/coverage/lcov.info. Percentages are calculated from "
    "the covered and total counts recorded for each source file.",
    styles["SmallNote"]
))
story.append(Spacer(1, 3 * mm))
frontend_table = [[
    Paragraph("Frontend source file", styles["CellHeader"]),
    Paragraph("Lines covered", styles["CellHeader"]),
    Paragraph("Branches covered", styles["CellHeader"]),
    Paragraph("Functions covered", styles["CellHeader"]),
]]
for item in frontend_rows:
    frontend_table.append([
        Paragraph(item["name"], styles["Cell"]),
        coverage_cell(item["lh"], item["lf"]),
        coverage_cell(item["brh"], item["brf"]),
        coverage_cell(item["fnh"], item["fnf"]),
    ])
story.append(make_table(
    frontend_table, [105*mm, 40*mm, 40*mm, 40*mm]
))
story.append(Spacer(1, 5 * mm))
story.append(Paragraph(
    "Coverage evidence limitations: This report reflects automated test "
    "execution only. It does not represent a complete browser, security, "
    "performance, availability, or requirements validation. Untested areas "
    "must remain identified in the test summary and requirements traceability "
    "matrix.",
    styles["SmallNote"]
))
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f"Created: {OUTPUT}")
print(f"Backend source files: {len(backend_rows)}")
print(f"Frontend source files: {len(frontend_rows)}")
