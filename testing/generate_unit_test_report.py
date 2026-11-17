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
FRONTEND_LOG = ROOT / "frontend" / "frontend-test-output.txt"
OUTPUT = ROOT / "testing" / "reports" / "Unit Test Report.pdf"
for path in (BACKEND_LOG, FRONTEND_LOG):
    if not path.exists():
        raise FileNotFoundError(f"Missing test evidence: {path}")
def read_log(path):
    raw = path.read_bytes()
    if raw.startswith((b"\xff\xfe", b"\xfe\xff")):
        text = raw.decode("utf-16")
    else:
        text = raw.decode("utf-8-sig", errors="replace")
    return re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", text)
backend_log = read_log(BACKEND_LOG)
frontend_log = read_log(FRONTEND_LOG)
if not re.search(r"tests\s+38", backend_log):
    raise RuntimeError("Backend log does not confirm 38 tests.")
if not re.search(r"pass\s+38", backend_log) or not re.search(r"fail\s+0", backend_log):
    raise RuntimeError("Backend log does not confirm 38 passed and 0 failed.")
if not re.search(r"Tests\s+12\s+passed", frontend_log, re.IGNORECASE):
    raise RuntimeError("Frontend log does not confirm 12 passed tests.")
if not re.search(r"Test Files\s+4\s+passed", frontend_log, re.IGNORECASE):
    raise RuntimeError("Frontend log does not confirm 4 passed test files.")
BACKEND_CASES = [
    'Health endpoint returns status and uptime',
    'Readiness reports not_ready when MongoDB is disconnected',
    'TC-07: Malformed JSON returns HTTP 400',
    'JSON request bodies larger than 1 MB return HTTP 413',
    'TC-03: Unsupported HTTP method returns 404',
    'TC-05: Each request receives a unique request ID',
    'TC-01: Health endpoint returns HTTP 200',
    'TC-06: Unknown route returns a structured 404 error',
    'Sprint 1: Login requires the documented identifier contract',
    'Sprint 1: Student tokens cannot access the question bank',
    'attempt start requires a student and never returns the answer key',
    'bulk and compatibility answer saves enforce ownership and are idempotent',
    'submission freezes grading, returns the result, and safely handles concurrent retries',
    'result percentiles use submitted attempts from the same exam and include ties',
    'question CSV import validates every row before creating questions',
    'a save after the deadline is rejected and finalizes and grades the attempt',
    'the background deadline sweep submits and grades disconnected attempts while preserving saved answers',
    'exam keeps its question version after the question bank is edited',
    'Readiness reports ready when MongoDB is connected',
    'audit log endpoint requires an instructor or admin',
    'admin can filter audit logs and does not receive metadata',
    'audit log limit is clamped to 100',
    'locks an account after five failed logins',
    'successful login resets failed login state',
    'signs a token with user id, role, and expiry',
    'rejects a token with a tampered signature',
    'rejects an expired token',
    'requireAuth attaches the verified user to the request',
    'requireAuth rejects a missing bearer token with 401',
    'requireRole blocks users with the wrong role',
    'hashPassword creates a salted password hash',
    'verifyPassword accepts the original password',
    'verifyPassword rejects the wrong password',
    'verifyPassword rejects malformed hashes',
    'hashPassword rejects short passwords',
    'API rate limiter returns a structured 429 after its configured request cap',
    'API rate limiter allows 300 requests per IP in a minute by default',
    'login rate limiter normalizes identifiers and keeps distinct accounts separate',
]
if len(BACKEND_CASES) != 38:
    raise RuntimeError("Expected exactly 38 backend test descriptions.")
NAVY = colors.HexColor("#17365D")
PALE = colors.HexColor("#F1F5F9")
GRID = colors.HexColor("#C8D0DA")
GREY = colors.HexColor("#596579")
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="ReportTitle", parent=styles["Title"],
    fontName="Helvetica-Bold", fontSize=20, leading=24,
    textColor=NAVY, alignment=TA_CENTER, spaceAfter=4
))
styles.add(ParagraphStyle(
    name="SubTitle", parent=styles["Normal"],
    fontSize=9, leading=12, textColor=GREY,
    alignment=TA_CENTER, spaceAfter=10
))
styles.add(ParagraphStyle(
    name="Section", parent=styles["Heading2"],
    fontName="Helvetica-Bold", fontSize=12,
    leading=15, textColor=NAVY, spaceBefore=6, spaceAfter=6
))
styles.add(ParagraphStyle(
    name="BodySmall", parent=styles["BodyText"],
    fontSize=8, leading=11, textColor=GREY
))
styles.add(ParagraphStyle(
    name="Cell", parent=styles["BodyText"],
    fontSize=7.2, leading=8.6
))
styles.add(ParagraphStyle(
    name="CellSmall", parent=styles["BodyText"],
    fontSize=6.5, leading=7.8
))
styles.add(ParagraphStyle(
    name="HeaderCell", parent=styles["BodyText"],
    fontName="Helvetica-Bold", fontSize=7,
    leading=8, textColor=colors.white
))
def P(value, style="Cell"):
    return Paragraph(str(value), styles[style])
def make_table(data, widths, font_size=7, repeat=1):
    table = Table(
        data, colWidths=widths, repeatRows=repeat,
        hAlign="LEFT"
    )
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.35, GRID),
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), font_size),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PALE]),
    ]))
    return table
def footer(canvas, doc):
    canvas.saveState()
    width, _ = landscape(A4)
    canvas.setStrokeColor(GRID)
    canvas.line(15*mm, 12*mm, width-15*mm, 12*mm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(GREY)
    canvas.drawString(15*mm, 7*mm, "Online Exam Portal - Unit Test Evidence")
    canvas.drawRightString(width-15*mm, 7*mm, f"Page {doc.page}")
    canvas.restoreState()
doc = SimpleDocTemplate(
    str(OUTPUT), pagesize=landscape(A4),
    rightMargin=15*mm, leftMargin=15*mm,
    topMargin=13*mm, bottomMargin=17*mm,
    title="Unit Test Report",
    author="Online Exam Portal - Test Engineer"
)
story = []
# PAGE 1 - Execution summary
story.append(Paragraph("Unit Test Report", styles["ReportTitle"]))
story.append(Paragraph(
    "Online Exam Portal | Automated backend and frontend test execution",
    styles["SubTitle"]
))
metadata = [
    ["Report date", "17 November 2026", "Backend tested commit", "62c8d45"],
    ["Backend execution", "17 November 2026; isolated DB oep_timer_validation_20261117",
     "Frontend evidence", "15 November 2026; commit 0ce4ad7"],
    ["Backend runtime", "Node.js built-in test runner",
     "Frontend runner", "Vitest 4.1.12"],
]
story.append(make_table(
    [[P(x) for x in row] for row in metadata],
    [30*mm, 102*mm, 30*mm, 90*mm],
    repeat=0
))
story.append(Paragraph("Execution results", styles["Section"]))
results = [
    ["Suite", "Test files", "Executed", "Passed", "Failed", "Skipped", "Duration"],
    ["Backend", "7", "38", "38", "0", "0", "8.10 seconds"],
    ["Frontend", "4", "12", "12", "0", "0", "6.08 seconds"],
]
story.append(make_table(results, [
    45*mm, 35*mm, 30*mm, 30*mm, 30*mm, 30*mm, 45*mm
]))
story.append(Paragraph("Backend test-file breakdown", styles["Section"]))
backend_files = [
    ["Backend test file", "Tests", "Frontend test file", "Tests"],
    ["app.test.js", "10", "questionCsv.test.js", "5"],
    ["attempt.integration.test.js", "9", "ProtectedRoute.test.jsx", "3"],
    ["auth.integration.test.js", "2", "Results.test.jsx", "3"],
    ["audit.integration.test.js", "3", "", ""],
    ["auth.integration.test.js", "2", "", ""],
    ["jwt.test.js", "6", "", ""],
    ["password.test.js", "5", "", ""],
    ["rateLimits.test.js", "3", "", ""],
    ["Total", "38", "Total", "12"],
]
story.append(make_table(
    [[P(x) for x in row] for row in backend_files],
    [85*mm, 18*mm, 85*mm, 18*mm]
))
story.append(Spacer(1, 3*mm))
story.append(Paragraph(
    "Result: all 38 backend tests passed on 17 November 2026, commit 62c8d45. "
    "The 12 frontend tests passed in the separately recorded 15 November 2026 run, "
    "commit 0ce4ad7.",
    styles["BodySmall"]
))
story.append(Paragraph(
    "Scope note: automated unit and integration test results do not establish "
    "complete browser validation, full requirements coverage, production "
    "performance, security certification, or release readiness. Those areas "
    "are tracked separately in the system-validation evidence and RTM.",
    styles["BodySmall"]
))
# PAGE 2 - Backend test cases, split into two side-by-side columns
story.append(PageBreak())
story.append(Paragraph("Backend test case results", styles["Section"]))
story.append(Paragraph(
    "Execution source: backend/backend-coverage-output.txt. "
    "All 38 listed cases passed; no failures or skipped tests were reported.",
    styles["BodySmall"]
))
story.append(Spacer(1, 3*mm))
backend_rows = [[
    P("No.", "HeaderCell"), P("Test case", "HeaderCell"), P("Result", "HeaderCell"),
    P("No.", "HeaderCell"), P("Test case", "HeaderCell"), P("Result", "HeaderCell")
]]
for i in range(19):
    left_no = i + 1
    right_no = i + 20
    backend_rows.append([
        str(left_no),
        P(BACKEND_CASES[left_no-1], "CellSmall"),
        "PASS",
        str(right_no),
        P(BACKEND_CASES[right_no-1], "CellSmall"),
        "PASS",
    ])
story.append(make_table(
    backend_rows, [9*mm, 105*mm, 17*mm, 9*mm, 105*mm, 17*mm],
    font_size=6.5
))
story.append(Spacer(1, 4*mm))
story.append(Paragraph(
    "Backend test-file totals: app.test.js (10), attempt.integration.test.js (9), "
    "audit.integration.test.js (3), auth.integration.test.js (2), jwt.test.js (6), "
    "password.test.js (5), rateLimits.test.js (3). Total: 38.",
    styles["BodySmall"]
))
# PAGE 3 - Frontend test evidence and limitations
story.append(PageBreak())
story.append(Paragraph("Frontend test results", styles["Section"]))
story.append(Paragraph(
    "Execution source: frontend/frontend-test-output.txt. The Vitest output "
    "reports four test files passed and 12 tests passed, with V8 coverage enabled.",
    styles["BodySmall"]
))
story.append(Spacer(1, 3*mm))
frontend_rows = [
    ["Frontend test file", "Tests", "Observed test detail in saved output"],
    ["src/utils/questionCsv.test.js", "5",
     "Five tests passed. Individual test names were not printed in the saved output."],
    ["src/components/ProtectedRoute.test.jsx", "3",
     "Output explicitly shows: redirects visitors without a session to login."],
    ["src/pages/Results.test.jsx", "3",
     "Output explicitly shows: displays a student's score and formats percentile ordinals."],
    ["src/pages/QuestionBank.test.jsx", "1",
     "Output explicitly shows: sends parsed questions to the import API and reports success."],
    ["Total", "12", "All four test files passed."],
]
story.append(make_table(
    [[P(x) for x in row] for row in frontend_rows],
    [70*mm, 22*mm, 170*mm]
))
story.append(Paragraph("Execution evidence", styles["Section"]))
evidence = [
    ["Backend", "38 tests passed, 0 failed, 0 skipped; duration 8.10 seconds."],
    ["Frontend", "4 test files passed; 12 tests passed; 15 November 2026; commit 0ce4ad7."],
    ["Tested commits", "Backend: 62c8d45 (17 November); frontend: 0ce4ad7 (15 November)."],
    ["Backend coverage", "Lines 80.31%; branches 68.75%; functions 83.90% (17 November coverage run)."],
    ["Coverage evidence", "See the separate Combined Code and Branch Coverage Report.pdf."],
]
story.append(make_table(
    [[P(x) for x in row] for row in evidence],
    [42*mm, 220*mm],
    repeat=0
))
story.append(Paragraph("Limitations", styles["Section"]))
story.append(Paragraph(
    "The frontend output names only some individual assertions; this report "
    "does not invent names for the other test cases. Automated test success "
    "does not prove every user workflow or requirement. Browser-based system "
    "validation, role-specific workflows, timer-expiry behaviour, security, "
    "sustained load, and production availability must be assessed using their "
    "own evidence. Timer-expiry worker behavior and saved-answer preservation "
    "have automated integration coverage; real-time browser countdown and expiry "
    "verification remain separate. Frontend results retain their original date "
    "and commit and are not represented as a fresh run on backend commit 62c8d45.",
    styles["BodySmall"]
))
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f"Created: {OUTPUT}")
print("Backend tests: 38 passed, 0 failed")
print("Frontend tests: 12 passed, 0 failed")
print("Backend commit: 62c8d45; frontend evidence commit: 0ce4ad7")
print("Pages: summary, backend case results, frontend evidence")
