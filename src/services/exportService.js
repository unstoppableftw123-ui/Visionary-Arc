import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import jsPDF from "jspdf";
import PptxGenJS from "pptxgenjs";

function buildDocxParagraphs(content) {
  const lines = content.split("\n");
  return lines.map((line) => {
    if (line.startsWith("# ")) {
      return new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 });
    } else if (line.startsWith("## ")) {
      return new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      return new Paragraph({
        children: [new TextRun(line.slice(2))],
        bullet: { level: 0 },
      });
    } else {
      return new Paragraph({ children: [new TextRun(line)] });
    }
  });
}

export async function exportToDocx(title, content) {
  const doc = new Document({
    sections: [{ children: buildDocxParagraphs(content) }],
  });

  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "_")}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(title, content) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  doc.setFontSize(16);
  doc.text(title, margin, y);
  y += 10;

  doc.setFontSize(11);
  const lines = content.split("\n");
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line || " ", maxWidth);
    for (const wrappedLine of wrapped) {
      if (y > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(wrappedLine, margin, y);
      y += 6;
    }
  }

  doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
}

export async function exportToPPTX(title, slides) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";

  for (const slide of slides) {
    const s = pptx.addSlide();
    s.background = { color: "0E0E14" };

    s.addText(slide.title || "", {
      x: 0.5,
      y: 0.5,
      w: "90%",
      fontSize: 28,
      bold: true,
      color: "FFFFFF",
    });

    if (slide.bullets?.length) {
      const bulletText = slide.bullets.map((b) => ({ text: b, options: { bullet: true } }));
      s.addText(bulletText, {
        x: 0.5,
        y: 1.5,
        w: "90%",
        fontSize: 16,
        color: "FFFFFF",
      });
    } else if (slide.content) {
      s.addText(slide.content, {
        x: 0.5,
        y: 1.5,
        w: "90%",
        fontSize: 16,
        color: "FFFFFF",
      });
    }
  }

  await pptx.writeFile({ fileName: `${title.replace(/\s+/g, "_")}.pptx` });
}
