from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, PageBreak
)
ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "testing" / "reports" / "System Validation Report.pdf"
NAVY = colors.HexColor("#17365D")
PALE = colors.HexColor("#F1F5F9")
GRID = colors.HexColor("#C8D0DA")
GREY = colors.HexColor("#596579")
GREEN = colors.HexColor("#E2F0D9")
AMBER = colors.HexColor("#FFF2CC")
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
    leading=15, textColor=NAVY, spaceBefore=7, spaceAfter=6
))
styles.add(ParagraphStyle(
    name="SmallNote", parent=styles["BodyText"],
    fontSize=8, leading=11, textColor=GREY
))
styles.add(ParagraphStyle(
    name="Cell", parent=styles["BodyText"],
    fontSize=7.2, leading=8.8
))
styles.add(ParagraphStyle(
    name="CellSmall", parent=styles["BodyText"],
    fontSize=6.7, leading=8
))
styles.add(ParagraphStyle(
    name="HeaderCell", parent=styles["BodyText"],
    fontName="Helvetica-Bold", fontSize=7,
    leading=8.5, textColor=colors.white
))
def P(value, style="Cell"):
    return Paragraph(str(value), styles[style])
def make_table(data, widths, repeat=1, compact=False):
    table = Table(data, colWidths=widths, repeatRows=repeat, hAlign="LEFT")
    pad = 2 if compact else 3
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.35, GRID),
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), pad),
        ("BOTTOMPADDING", (0, 0), (-1, -1), pad),
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
    canvas.drawString(15*mm, 7*mm, "Online Exam Portal - System Validation Evidence")
    canvas.drawRightString(width-15*mm, 7*mm, f"Page {doc.page}")
    canvas.restoreState()
doc = SimpleDocTemplate(
    str(OUTPUT), pagesize=landscape(A4),
    rightMargin=15*mm, leftMargin=15*mm,
    topMargin=13*mm, bottomMargin=18*mm,
    title="System Validation Report",
    author="Online Exam Portal - Test Engineer"
)
story = []
# PAGE 1 - Current run summary
story.append(Paragraph("System Validation Report", styles["ReportTitle"]))
story.append(Paragraph(
    "Online Exam Portal | Manual browser validation and workflow evidence",
    styles["SubTitle"]
))
metadata = [
    ["Current validation date", "15 November 2026",
     "Application commit", "0ce4ad7"],
    ["Frontend", "http://localhost:5173/",
     "Backend", "http://localhost:3000"],
    ["Database", "oep_system_validation_20261115",
     "Browser", "Chrome on Windows; exact version not recorded"],
    ["Test account", "Seeded student account",
     "Sample exam", "Sprint 1 Sample Exam - 10 questions, 30 minutes"],
]
story.append(make_table(
    [[P(x) for x in row] for row in metadata],
    [39*mm, 88*mm, 35*mm, 100*mm],
    repeat=0
))
story.append(Paragraph("Current validation result", styles["Section"]))
summary = [
    ["Validation scope", "Checks", "Passed", "Failed"],
    ["Student login and exam workflow", "12", "12", "0"],
]
story.append(make_table(
    summary, [100*mm, 35*mm, 35*mm, 35*mm]
))
story.append(Spacer(1, 3*mm))
story.append(Paragraph(
    "<b>Result:</b> The 12 documented student-workflow checks below were "
    "observed during the November 15 browser session against commit 0ce4ad7. "
    "The test used a separate local MongoDB database named "
    "oep_system_validation_20261115.",
    styles["SmallNote"]
))
story.append(Paragraph("Environment and test setup", styles["Section"]))
environment = [
    ["Component", "Observed configuration"],
    ["Operating environment", "Local Windows development environment"],
    ["Frontend server", "Vite development server on localhost port 5173"],
    ["Backend server", "HTTP API on localhost port 3000"],
    ["Database server", "Local MongoDB on 127.0.0.1:27017"],
    ["Test data", "Seeded admin, instructor, three students, ten questions and sample exam"],
    ["Application source", "Repository commit 0ce4ad7"],
]
story.append(make_table(
    [[P(x) for x in row] for row in environment],
    [55*mm, 207*mm]
))
story.append(Paragraph("Execution notes", styles["Section"]))
story.append(Paragraph(
    "During setup, login requests initially returned INVALID_CREDENTIALS "
    "while multiple old backend development processes were present. The "
    "duplicate backend processes were stopped, then one backend was started "
    "on port 3000 with the isolated validation database. The seeded student "
    "account and password hash were independently verified, and the login "
    "API subsequently returned success with the student role. Browser login "
    "then completed and the student workflow was exercised.",
    styles["SmallNote"]
))
# PAGE 2 - Current browser checks
story.append(PageBreak())
story.append(Paragraph("Current browser validation - 15 November 2026", styles["Section"]))
story.append(Paragraph(
    "The following checks describe the final browser session after the "
    "backend process cleanup and successful student authentication.",
    styles["SmallNote"]
))
story.append(Spacer(1, 3*mm))
checks = [
    ("SV-01", "Login page renders",
     "Login heading, email field, password field, Login button and Register link displayed."),
    ("SV-02", "Student authentication",
     "Seeded student login succeeded in the browser and opened the student workspace."),
    ("SV-03", "Student dashboard",
     "Dashboard loaded and displayed available, completed and average-score summary cards."),
    ("SV-04", "Available examination listing",
     "Sprint 1 Sample Exam appeared as Available; duration displayed as 30 minutes."),
    ("SV-05", "Start exam and render questions",
     "Exam page opened with question 1 of 10, four options and a question navigator."),
    ("SV-06", "Countdown timer",
     "Timer displayed 29:58 at start and later decreased to 28:45 and 27:36."),
    ("SV-07", "Answer saving and navigator",
     "Save status displayed Saved; questions 1 through 6 were marked Answered."),
    ("SV-08", "Previous-question persistence",
     "After navigating back to question 5, Option B remained selected and save status was Saved."),
    ("SV-09", "Next-question persistence",
     "After returning to question 6, the user confirmed Option C remained selected."),
    ("SV-10", "Exam submission",
     "Successful-submission message appeared; answer controls and question navigation were disabled."),
    ("SV-11", "Dashboard result update",
     "Dashboard showed 1 completed exam, 10.0% average score and a recent result for the sample exam."),
    ("SV-12", "Detailed result record",
     "Results page showed Sprint 1 Sample Exam, score 1/10, 10.0% and 100th percentile."),
]
check_table = [[
    P("ID", "HeaderCell"),
    P("Validation check", "HeaderCell"),
    P("Observed result", "HeaderCell"),
    P("Status", "HeaderCell")
]]
for case_id, name, observation in checks:
    check_table.append([
        case_id,
        P(name, "Cell"),
        P(observation, "CellSmall"),
        "PASS"
    ])
story.append(make_table(
    check_table, [18*mm, 48*mm, 178*mm, 18*mm],
    compact=True
))
story.append(Spacer(1, 4*mm))
story.append(Paragraph("Result details and observations", styles["Section"]))
observations = [
    ["Submitted exam", "Sprint 1 Sample Exam"],
    ["Submitted score", "1 out of 10 (10.0%)"],
    ["Percentile displayed", "100th; the validation database contained only this one student attempt."],
    ["Navigation persistence", "Question 5 Option B and Question 6 Option C were retained when navigating between them."],
    ["Visual observation", "The Student Exam page appeared less styled than the dashboard. Core controls remained visible and functional. Record as a UI consistency observation, not a failed functional check."],
]
story.append(make_table(
    [[P(x) for x in row] for row in observations],
    [48*mm, 214*mm],
    repeat=0
))
story.append(Spacer(1, 3*mm))
story.append(Paragraph(
    "Evidence note: browser screenshots were reviewed during the validation "
    "session. The screenshot image files have not been copied into the "
    "repository by this report-generation step.",
    styles["SmallNote"]
))
# PAGE 3 - Historical evidence and limitations
story.append(PageBreak())
story.append(Paragraph("Historical browser evidence", styles["Section"]))
story.append(Paragraph(
    "The earlier System Validation Report recorded a separate 7/7 browser "
    "validation run dated 10 November 2026. That run used local frontend and "
    "backend services and an isolated MongoDB database named oep_phase2_browser. "
    "It is retained here as historical evidence only; it is not included in "
    "the current 12-check result.",
    styles["SmallNote"]
))
story.append(Spacer(1, 3*mm))
historical = [
    ["Historical check from 10 November 2026", "Recorded result"],
    ["Login page renders", "PASS"],
    ["Seed student can log in and reach dashboard", "PASS"],
    ["Sample exam is listed and can be started", "PASS"],
    ["Question display and timer appear", "PASS"],
    ["Two answers can be saved and selections retained while navigating", "PASS"],
    ["Submission confirmation appears", "PASS"],
    ["Result row is displayed", "PASS"],
    ["Historical total", "7 / 7 passed"],
]
story.append(make_table(
    [[P(x) for x in row] for row in historical],
    [175*mm, 87*mm],
    repeat=1
))
story.append(Paragraph("Not covered by this current browser run", styles["Section"]))
untested = [
    ["Area", "Validation status / limitation"],
    ["Registration workflow", "Not tested in the November 15 browser session."],
    ["Invalid credentials and account lockout UI", "Not included in the successful current browser workflow."],
    ["Admin and instructor workflows", "Not tested in this student-only browser run."],
    ["Timer expiry and automatic submission", "Not tested; the exam was submitted manually before timeout."],
    ["Large-cohort percentile behaviour", "Not established; the validation database contained only one submitted attempt."],
    ["Security and TLS validation", "Not established by this browser workflow."],
    ["Concurrent load and sustained performance", "Not covered by this browser workflow; the separate 200-concurrent-user load scenario remains outstanding."],
    ["Full requirements coverage and production availability", "Not established by the checks recorded here."],
]
story.append(make_table(
    [[P(x) for x in row] for row in untested],
    [65*mm, 197*mm],
    compact=True
))
story.append(Paragraph("Report status", styles["Section"]))
story.append(Paragraph(
    "This is an interim system-validation evidence report. It documents the "
    "observed local student workflow and clearly identifies untested areas. "
    "It is not a complete system acceptance report, security certification, "
    "production-readiness assessment, or final release sign-off.",
    styles["SmallNote"]
))
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f"Created: {OUTPUT}")
print("Current browser checks: 12 PASS, 0 FAIL")
print("Historical browser checks: 7 PASS on 10 November 2026")
print("Current tested commit: 0ce4ad7")
print("Pages: current summary, current checks, historical evidence and limitations")
