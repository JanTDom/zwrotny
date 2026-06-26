import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const promptPath = path.join(process.cwd(), 'BACKEND_PROMPT_CLAUDE.md');
  const content = fs.readFileSync(promptPath, 'utf-8');
  
  const lines = content.split('\n');
  const children: Paragraph[] = [];
  
  let inCodeBlock = false;
  let codeContent = '';
  
  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: codeContent,
                font: 'Courier New',
                size: 18,
              }),
            ],
            spacing: { after: 200 },
          })
        );
        codeContent = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeContent += line + '\n';
      continue;
    }
    
    if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: line.replace('# ', ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
    } else if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: line.replace('## ', ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
    } else if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: line.replace('### ', ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '• ' + line.replace(/^[-*] /, ''),
              size: 22,
            }),
          ],
          spacing: { after: 50 },
        })
      );
    } else if (line.trim() === '') {
      children.push(new Paragraph({ text: '' }));
    } else {
      // Bold text handling
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const textRuns: TextRun[] = [];
      
      for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
          textRuns.push(
            new TextRun({
              text: part.replace(/\*\*/g, ''),
              bold: true,
              size: 22,
            })
          );
        } else {
          textRuns.push(
            new TextRun({
              text: part,
              size: 22,
            })
          );
        }
      }
      
      children.push(
        new Paragraph({
          children: textRuns,
          spacing: { after: 100 },
        })
      );
    }
  }
  
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
  
  const buffer = await Packer.toBuffer(doc);
  
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="BACKEND_PROMPT_CLAUDE.docx"',
    },
  });
}
