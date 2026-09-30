"""Generate the public resume from the approved portfolio facts."""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether

ROOT = Path(__file__).resolve().parent.parent
INK = colors.HexColor('#1b2320')
MUTED = colors.HexColor('#4d5b53')
GREEN = colors.HexColor('#356048')
LINE = colors.HexColor('#d4ddd4')
styles = {
    'name': ParagraphStyle('name', fontName='Helvetica', fontSize=32, leading=36, textColor=INK, spaceAfter=8),
    'position': ParagraphStyle('position', fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=GREEN, spaceAfter=8),
    'contact': ParagraphStyle('contact', fontName='Helvetica', fontSize=8.3, leading=13, textColor=MUTED),
    'label': ParagraphStyle('label', fontName='Helvetica-Bold', fontSize=8.2, leading=12, textColor=GREEN, spaceBefore=14, spaceAfter=8, keepWithNext=True),
    'role': ParagraphStyle('role', fontName='Helvetica-Bold', fontSize=11, leading=15, textColor=INK, spaceAfter=4, keepWithNext=True),
    'meta': ParagraphStyle('meta', fontName='Helvetica', fontSize=8.5, leading=12, textColor=MUTED, spaceAfter=8),
    'body': ParagraphStyle('body', fontName='Helvetica', fontSize=9.2, leading=13.2, textColor=INK, spaceAfter=6),
    'small': ParagraphStyle('small', fontName='Helvetica', fontSize=8.2, leading=12, textColor=MUTED, spaceAfter=6),
    'bullet': ParagraphStyle('bullet', fontName='Helvetica', fontSize=9.2, leading=13.2, textColor=INK, leftIndent=10, firstLineIndent=-10, spaceAfter=5),
}

def p(text, style='body'):
    return Paragraph(text, styles[style])

story = []

def add(text, style='body'):
    story.append(p(text, style))

def role(title, company, dates, bullets, former=None):
    header = [p(title, 'role'), p(f'{company} | {dates}', 'meta')]
    if former:
        header.append(p(former, 'small'))
    story.append(KeepTogether(header + [p('- ' + bullets[0], 'bullet')]))
    story.extend(p('- ' + text, 'bullet') for text in bullets[1:])

add('RICHARD CALIENDO', 'name')
add('Technical Program Leadership | SaaS Transformation | AI Enablement', 'position')
add('Hollywood, FL | Remote US-wide / South Florida | (518) 944-1138', 'contact')
add('<link href="mailto:Richard.Caliendo@outlook.com">Richard.Caliendo@outlook.com</link> | <link href="https://richardecaliendo.com/">richardecaliendo.com</link> | <link href="https://www.linkedin.com/in/richardecaliendo/">LinkedIn</link>', 'contact')
add('PROFILE', 'label')
add('Staff Technical Program Manager connecting executive strategy to Product and Engineering execution across Cyber Resilience, Backup SaaS, portfolio consolidation, cloud modernization, and enterprise AI adoption. Builds ownership, dependency visibility, roadmaps, governance, and decision support that make complex strategy deliverable. A background in organizational change brings adoption and cross-team alignment into the plan from day one.')
add('CURRENT EXPERIENCE', 'label')
role('Staff Technical Program Manager, Product &amp; Engineering', 'Kaseya', 'Aug 2025 - Present', [
    'Lead program execution across the Cyber Resilience and Backup SaaS portfolio, including portfolio consolidation, migration workstreams, platform releases, and enterprise AI adoption.',
    'Coordinated 7 customer-facing Cyber Resilience launches in 2026, managing cross-team dependencies, launch risk, and GTM readiness. Examples include AI-powered backup screenshot verification, Azure Files and Azure Blob backup and restore, agentless Hyper-V, and the Unified Cyber Resilience Portal at alpha and early access.'
], former='Formerly Associate Director, Technical Program Management')
add('SELECTED TRANSFORMATION PROGRAMS', 'label')
add('Backup portfolio consolidation &amp; object-storage migration', 'role')
add('Lead the program mechanics for consolidating a multi-product Backup portfolio toward a natively built object-storage data plane. Established migration workstreams, Jira-aligned roadmaps, epic standards, source-linked dashboards, per-product sessions, and escalation paths. Make dependencies across Product, Engineering, Architecture, Infrastructure, Security, Finance, and GTM visible. Migration remains in progress; public-cloud deployment, lower infrastructure cost, and regulated-market readiness are strategic objectives.')
add('Enterprise AI adoption &amp; enablement', 'role')
add('Led adoption and enablement for 1,500+ engineers and product leaders. Consolidated Claude, Codex, Cursor, and Lovable; built governance, workflow integration, adoption tracking, and a peer-led enablement community. Developed executive ROI models connecting AI investment to dashboard-tracked productivity and cost efficiency, informing multi-million-dollar funding decisions.')
add('Revenue &amp; portfolio execution', 'role')
add('Program-managed an H1 strategic initiatives portfolio targeting multi-million-dollar FY26 revenue impact across churn reduction, evergreen, and customer reactivation. Partnered with Marketing leadership on customer-centered positioning and with Boston Consulting Group and executives on Backup portfolio analysis, repositioning, and pricing, translating recommendations into roadmap, GTM, and delivery execution.')
add('Platform release governance', 'role')
add('Drove Unified Cyber Resilience Portal execution through H1 2026 alpha and June 2026 early access. Continues to coordinate delivery and release readiness on the path to general availability.', 'small')

story.append(PageBreak())
add('RICHARD CALIENDO', 'role')
add('Technical Program Leadership | Career &amp; Capabilities', 'meta')
add('EARLIER EXPERIENCE', 'label')
role('Associate Director, Training &amp; Development', 'Kaseya', 'Aug 2024 - Aug 2025', [
    "Built leadership and manager enablement for a 5,000+ employee global technology organization. Designed and launched the company's first enterprise goal-cascading system across Sales, Engineering, Support, and Operations.",
    'Co-developed the first leadership development program with Gallup, embedding coaching-based accountability across revenue-facing teams. Built KPI dashboards linking manager effectiveness to engagement, execution, and revenue.'
])
story.append(Spacer(1, 8))
role('Manager, Training &amp; Development', 'Kaseya', 'Jul 2023 - Aug 2024', [
    'Launched the first global New Employee Orientation program and operationalized a self-paced learning ecosystem. Designed mandatory and role-based learning across Code of Conduct, AI literacy and policy, cybersecurity, and product knowledge.'
])
story.append(Spacer(1, 8))
role('Manager of Clinical Training and Development', 'Banyan Health Systems', 'Aug 2021 - Jul 2023', [
    'Ran the clinical training lifecycle across multidisciplinary teams and led implementation of WELLE Behavioral Emergency Safety Training, supporting cultural and operational improvements.'
])
story.append(Spacer(1, 8))
role('Program Specialist', 'New York State Office of Mental Health (Research Foundation for Mental Hygiene)', 'Jun 2020 - Aug 2021', [
    'Designed training for 55 provider agencies launching a statewide FEMA Crisis Counseling Program. Served as SME to the NYS Psychiatric Institute and Center for Practice Innovations; co-authored quarterly reports to NYS and FEMA.'
])
add('OPERATING CAPABILITIES &amp; TOOLS', 'label')
add('<b>Program systems:</b> Jira, Jira Plans, Confluence, Asana, Atlassian Rovo, Agile / Scrum, SAFe, dependency mapping, release management, portfolio dashboards.', 'small')
add('<b>AI enablement:</b> Claude, Claude Code, Codex, GitHub Copilot, Cursor, Lovable, M365 Copilot, MCP, AI governance, prompt and workflow design.', 'small')
add('<b>Analytics, automation &amp; collaboration:</b> Power BI, Excel, Power Automate, Power Apps, SharePoint, Microsoft 365, Zapier.', 'small')
add('<b>Program domains:</b> Backup &amp; BCDR, SaaS portfolio consolidation, object-storage data-plane migration, public-cloud migration, Microsoft Azure, FedRAMP readiness. Technical domains describe program scope, not engineering ownership or certifications.', 'small')
add('EDUCATION &amp; SELECTED AUTHORSHIP', 'label')
add('<b>M.Ed., Community Mental Health Counseling</b> | The College of Saint Rose | GPA 3.96<br/><b>B.A., Psychology</b> | SUNY Oneonta | GPA 3.87', 'small')
add('<b>SimonSez IT:</b> Leadership Development Author. Published curriculum on management, productivity, and performance systems.<br/><b>LearningMate:</b> Psychology Subject Matter Expert. Advised on psychology-informed learning design.', 'small')

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(42, 35, 570, 35)
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(42, 23, 'Richard Caliendo | richardecaliendo.com')
    canvas.drawRightString(570, 23, f'{doc.page} / 2')
    canvas.restoreState()

doc = SimpleDocTemplate(str(ROOT / 'Richard_Caliendo_Resume.pdf'), pagesize=(612, 792), rightMargin=42, leftMargin=42, topMargin=36, bottomMargin=48, title='Richard Caliendo | Technical Program Leadership', author='Richard Caliendo', subject='SaaS transformation, AI enablement, and Product & Engineering execution')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print('Generated public resume from approved portfolio facts.')
