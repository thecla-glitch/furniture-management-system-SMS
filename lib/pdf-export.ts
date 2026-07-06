// PDF export helpers for Director Portal reports.
// Uses jsPDF for layout + html2canvas to capture chart sections.
// All functions are async and must be called client-side only.

import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export interface PDFSection {
  title: string
  /** Element ID to capture as an image. If omitted, no canvas snapshot. */
  elementId?: string
  /** Plain rows to render as a simple table (header + data rows). */
  table?: {
    headers: string[]
    rows: (string | number)[][]
    footerRow?: (string | number)[]
  }
  /** Summary key-value pairs to render above the table. */
  stats?: { label: string; value: string }[]
}

const BRAND = "#2D2D2D"
const ACCENT = "#4F7BEF"
const MUTED = "#6B7280"
const LINE = "#E5E7EB"

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  const pageW = doc.internal.pageSize.getWidth()
  doc.setFillColor(BRAND)
  doc.rect(0, 0, pageW, 18, "F")
  doc.setTextColor("#FFFFFF")
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text(title, 14, 11)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text(subtitle, 14, 16)
  doc.text(
    `Generated ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`,
    pageW - 14,
    11,
    { align: "right" }
  )
}

function addSectionTitle(doc: jsPDF, text: string, y: number): number {
  const pageW = doc.internal.pageSize.getWidth()
  doc.setFillColor(ACCENT)
  doc.rect(14, y, pageW - 28, 7, "F")
  doc.setTextColor("#FFFFFF")
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text(text, 17, y + 5)
  return y + 12
}

function addStats(
  doc: jsPDF,
  stats: { label: string; value: string }[],
  y: number
): number {
  const pageW = doc.internal.pageSize.getWidth()
  const colW = (pageW - 28) / Math.min(stats.length, 4)
  stats.forEach((s, i) => {
    const col = i % 4
    const x = 14 + col * colW
    if (i > 0 && col === 0) y += 18

    doc.setFillColor("#F9FAFB")
    doc.roundedRect(x, y, colW - 3, 14, 2, 2, "F")
    doc.setTextColor(MUTED)
    doc.setFontSize(6.5)
    doc.setFont("helvetica", "normal")
    doc.text(s.label, x + 4, y + 5)
    doc.setTextColor(BRAND)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text(s.value, x + 4, y + 11)
  })
  const rows = Math.ceil(stats.length / 4)
  return y + rows * 18 + 4
}

function addTable(
  doc: jsPDF,
  headers: string[],
  rows: (string | number)[][],
  startY: number,
  footerRow?: (string | number)[]
): number {
  const pageW = doc.internal.pageSize.getWidth()
  const usableW = pageW - 28
  const colW = usableW / headers.length

  // Header row
  doc.setFillColor("#F3F4F6")
  doc.rect(14, startY, usableW, 7, "F")
  doc.setTextColor(BRAND)
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "bold")
  headers.forEach((h, i) => {
    doc.text(String(h), 14 + i * colW + 2, startY + 5, {
      maxWidth: colW - 4,
    })
  })
  let y = startY + 7

  rows.forEach((row, ri) => {
    if (y > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      y = 25
    }
    if (ri % 2 === 0) {
      doc.setFillColor("#FAFAFA")
      doc.rect(14, y, usableW, 6.5, "F")
    }
    doc.setTextColor(MUTED)
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    row.forEach((cell, ci) => {
      doc.text(String(cell), 14 + ci * colW + 2, y + 4.5, {
        maxWidth: colW - 4,
      })
    })
    y += 6.5
  })

  if (footerRow) {
    doc.setFillColor(BRAND)
    doc.rect(14, y, usableW, 7, "F")
    doc.setTextColor("#FFFFFF")
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "bold")
    footerRow.forEach((cell, ci) => {
      doc.text(String(cell), 14 + ci * colW + 2, y + 5, {
        maxWidth: colW - 4,
      })
    })
    y += 7
  }

  // bottom line
  doc.setDrawColor(LINE)
  doc.line(14, y + 1, pageW - 14, y + 1)
  return y + 6
}

/** Capture a DOM element and embed it as an image in the PDF at the given y. */
async function embedElement(
  doc: jsPDF,
  elementId: string,
  y: number
): Promise<number> {
  const el = document.getElementById(elementId)
  if (!el) return y
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false })
  const imgData = canvas.toDataURL("image/png")
  const pageW = doc.internal.pageSize.getWidth()
  const usableW = pageW - 28
  const ratio = canvas.height / canvas.width
  const imgH = usableW * ratio
  if (y + imgH > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage()
    y = 25
  }
  doc.addImage(imgData, "PNG", 14, y, usableW, imgH)
  return y + imgH + 8
}

/** Build a multi-section PDF and trigger browser download. */
export async function downloadPDF(
  filename: string,
  reportTitle: string,
  subtitle: string,
  sections: PDFSection[]
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })
  addHeader(doc, reportTitle, subtitle)
  let y = 26

  for (const section of sections) {
    y = addSectionTitle(doc, section.title, y)

    if (section.stats) {
      y = addStats(doc, section.stats, y)
    }

    if (section.elementId) {
      y = await embedElement(doc, section.elementId, y)
    }

    if (section.table) {
      y = addTable(
        doc,
        section.table.headers,
        section.table.rows,
        y,
        section.table.footerRow
      )
    }

    y += 6
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage()
      y = 25
    }
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setTextColor(MUTED)
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: "center" }
    )
  }

  doc.save(filename)
}
