// Browser-only module — only imported by Client Components.
// jsPDF runs entirely in the browser, like a Python script that writes to disk locally.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportSecret {
  type: string;
  file: string;
  line: number;
  preview: string;
}

export interface ReportVuln {
  name: string;
  severity: string;
  description: string;
  fixAvailable: boolean;
}

export interface AuditReportData {
  id: string;
  score: number;
  scannedFiles: number;
  secretsCount: number;
  vulnerabilitiesCount: number;
  findings: {
    secrets: ReportSecret[];
    vulnerabilities: ReportVuln[];
  };
  createdAt: string;
  username?: string;
}

// jspdf-autotable attaches lastAutoTable to the doc instance after each call
interface DocWithTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

// ─── Color palette ────────────────────────────────────────────────────────────

const C = {
  navy:    "#0f172a",
  indigo:  "#6366f1",
  green:   "#10b981",
  yellow:  "#f59e0b",
  red:     "#ef4444",
  orange:  "#f97316",
  slate:   "#94a3b8",
  white:   "#ffffff",
  light:   "#f8fafc",
  border:  "#e2e8f0",
  greenBg: "#f0fdf4",
  redBg:   "#fef2f2",
  yellowBg:"#fffbeb",
};

function scoreColor(score: number) {
  if (score >= 80) return C.green;
  if (score >= 50) return C.yellow;
  return C.red;
}

function scoreLabel(score: number) {
  if (score >= 80) return "CERTIFIED SECURE";
  if (score >= 50) return "NEEDS ATTENTION";
  return "AT RISK";
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: C.red,
  high:     C.orange,
  moderate: C.yellow,
  low:      C.slate,
};

// ─── Generator ────────────────────────────────────────────────────────────────

export function generateAuditPDF(data: AuditReportData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" }) as DocWithTable;
  const W = 210;
  const M = 20;            // left/right margin
  const CW = W - M * 2;   // content width
  let y = 0;

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(C.navy);
  doc.rect(0, 0, W, 60, "F");

  // Left: title
  doc.setTextColor(C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SECURITY AUDIT CERTIFICATION", M, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(C.slate);
  doc.text("Forensic Audit Platform  ·  Confidential Report", M, 30);

  // Right: score circle
  const sc = scoreColor(data.score);
  const cx = W - 30, cy = 28;
  doc.setFillColor(sc);
  doc.circle(cx, cy, 15, "F");
  doc.setTextColor(C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(String(data.score), cx, cy + 3.5, { align: "center" });
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(C.white);
  doc.text("/ 100", cx, cy + 9, { align: "center" });

  // Status pill
  doc.setFillColor(sc);
  doc.roundedRect(M, 38, 58, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(C.white);
  doc.text(scoreLabel(data.score), M + 29, 44.5, { align: "center" });

  // Date
  const dateStr = new Intl.DateTimeFormat("en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(data.createdAt));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(C.slate);
  doc.text(dateStr, W - M, 44, { align: "right" });

  y = 70;

  // ── Metadata strip ───────────────────────────────────────────────────────
  doc.setFillColor(C.light);
  doc.setDrawColor(C.border);
  doc.setLineWidth(0.3);
  doc.rect(M, y, CW, 22, "FD");

  const meta = [
    ["REPORT ID",       data.id.slice(0, 8).toUpperCase()],
    ["FILES SCANNED",   String(data.scannedFiles)],
    ...(data.username ? [["ACCOUNT", `@${data.username}`]] : []),
  ];
  meta.forEach(([label, value], i) => {
    const x = M + 4 + i * 58;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(C.slate);
    doc.text(label, x, y + 9);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(C.navy);
    doc.text(value, x, y + 17);
  });

  y += 30;

  // ── Summary cards ────────────────────────────────────────────────────────
  const cardW = (CW - 5) / 2;

  // Secrets card
  doc.setFillColor(data.secretsCount > 0 ? C.redBg : C.greenBg);
  doc.setDrawColor(data.secretsCount > 0 ? C.red : C.green);
  doc.setLineWidth(0.4);
  doc.rect(M, y, cardW, 24, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(C.slate);
  doc.text("EXPOSED SECRETS", M + 4, y + 9);
  doc.setFontSize(24);
  doc.setTextColor(data.secretsCount > 0 ? C.red : C.green);
  doc.text(String(data.secretsCount), M + 4, y + 21);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(C.slate);
  doc.text(data.secretsCount === 0 ? "None found" : "Review required", M + 20, y + 21);

  // Vulnerabilities card
  doc.setFillColor(data.vulnerabilitiesCount > 0 ? C.yellowBg : C.greenBg);
  doc.setDrawColor(data.vulnerabilitiesCount > 0 ? C.yellow : C.green);
  doc.rect(M + cardW + 5, y, cardW, 24, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(C.slate);
  doc.text("VULNERABLE DEPENDENCIES", M + cardW + 9, y + 9);
  doc.setFontSize(24);
  doc.setTextColor(data.vulnerabilitiesCount > 0 ? C.yellow : C.green);
  doc.text(String(data.vulnerabilitiesCount), M + cardW + 9, y + 21);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(C.slate);
  doc.text(data.vulnerabilitiesCount === 0 ? "All clear" : "Action recommended", M + cardW + 22, y + 21);

  y += 32;

  // ── Section helper ───────────────────────────────────────────────────────
  function sectionHeader(title: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(C.navy);
    doc.text(title, M, y);
    doc.setDrawColor(C.indigo);
    doc.setLineWidth(0.6);
    doc.line(M, y + 2, M + doc.getTextWidth(title), y + 2);
    y += 8;
  }

  // ── Secrets section ──────────────────────────────────────────────────────
  sectionHeader("Exposed Secrets");

  if (data.findings.secrets.length === 0) {
    doc.setFillColor(C.greenBg);
    doc.rect(M, y, CW, 12, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(C.green);
    doc.text("✓  No secrets detected in this scan.", M + 4, y + 8);
    y += 18;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Type", "File", "Line", "Preview"]],
      body: data.findings.secrets.map((s) => [s.type, s.file, String(s.line), s.preview]),
      theme: "grid",
      headStyles: { fillColor: hexToRgb(C.navy), textColor: hexToRgb(C.white), fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: hexToRgb(C.navy) },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 65, fontStyle: "italic" },
        2: { cellWidth: 14, halign: "center" },
        3: { cellWidth: 43, font: "courier", fontSize: 7 },
      },
      margin: { left: M, right: M },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── Vulnerabilities section ───────────────────────────────────────────────
  sectionHeader("Dependency Vulnerabilities");

  if (data.findings.vulnerabilities.length === 0) {
    doc.setFillColor(C.greenBg);
    doc.rect(M, y, CW, 12, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(C.green);
    doc.text("✓  No known vulnerable dependencies detected.", M + 4, y + 8);
    y += 18;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Package", "Severity", "Description", "Fix?"]],
      body: data.findings.vulnerabilities.map((v) => [
        v.name,
        v.severity.toUpperCase(),
        v.description,
        v.fixAvailable ? "Yes" : "No",
      ]),
      theme: "grid",
      headStyles: { fillColor: hexToRgb(C.navy), textColor: hexToRgb(C.white), fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: hexToRgb(C.navy) },
      columnStyles: {
        0: { cellWidth: 38, fontStyle: "bold" },
        1: { cellWidth: 22, halign: "center", fontStyle: "bold" },
        2: { cellWidth: 90 },
        3: { cellWidth: 14, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.column.index === 1 && data.section === "body") {
          const sev = String(data.cell.raw).toLowerCase();
          data.cell.styles.textColor = hexToRgb(SEVERITY_COLOR[sev] ?? C.slate);
        }
        if (data.column.index === 3 && data.section === "body") {
          data.cell.styles.textColor = data.cell.raw === "Yes"
            ? hexToRgb(C.green)
            : hexToRgb(C.slate);
        }
      },
      margin: { left: M, right: M },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  const PH = 297;
  doc.setFillColor(C.navy);
  doc.rect(0, PH - 18, W, 18, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(C.slate);
  doc.text(
    "Generated by Forensic Audit Platform  ·  This report is confidential and intended for the account holder only.",
    M, PH - 10
  );
  doc.text(
    `Report ID: ${data.id.slice(0, 8).toUpperCase()}  ·  Page 1 of 1`,
    W - M, PH - 10, { align: "right" }
  );

  doc.save(`forensic-audit-${data.id.slice(0, 8)}.pdf`);
}
