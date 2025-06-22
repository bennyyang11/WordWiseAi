import type { Document } from '../types';

export type ExportFormat = 'docx' | 'pdf' | 'txt' | 'html' | 'rtf';

export interface ExportOptions {
  format: ExportFormat;
  title: string;
  includeMetadata?: boolean;
  includeStatistics?: boolean;
}

export interface ExportResult {
  success: boolean;
  error?: string;
  fileName?: string;
}

class ExportService {
  // Main export function
  async exportDocument(document: Document, options: ExportOptions): Promise<ExportResult> {
    try {
      const fileName = this.generateFileName(options.title, options.format);
      
      switch (options.format) {
        case 'txt':
          this.exportAsTxt(document, fileName, options);
          break;
        case 'html':
          this.exportAsHtml(document, fileName, options);
          break;
        case 'rtf':
          this.exportAsRtf(document, fileName, options);
          break;
        case 'docx':
          await this.exportAsDocx(document, fileName, options);
          break;
        case 'pdf':
          await this.exportAsPdf(document, fileName, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      return { success: true, fileName };
    } catch (error) {
      console.error('Export error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Export failed' 
      };
    }
  }

  // Export as plain text
  private exportAsTxt(document: Document, fileName: string, options: ExportOptions): void {
    let content = '';
    
    if (options.includeMetadata) {
      content += `Title: ${document.title}\n`;
      content += `Created: ${document.createdAt.toLocaleDateString()}\n`;
      content += `Last Modified: ${document.updatedAt.toLocaleDateString()}\n`;
      content += `Word Count: ${document.wordCount}\n`;
      content += '\n' + '='.repeat(50) + '\n\n';
    }
    
    content += document.content;
    
    if (options.includeStatistics) {
      content += '\n\n' + '='.repeat(50) + '\n';
      content += 'DOCUMENT STATISTICS:\n';
      content += `Words: ${document.wordCount}\n`;
      content += `Characters: ${document.content.length}\n`;
      content += `Paragraphs: ${document.content.split('\n\n').filter(p => p.trim().length > 0).length}\n`;
    }

    this.downloadFile(content, fileName, 'text/plain');
  }

  // Export as HTML
  private exportAsHtml(document: Document, fileName: string, options: ExportOptions): void {
    const content = document.content
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => `<p>${this.escapeHtml(paragraph.replace(/\n/g, '<br>'))}</p>`)
      .join('\n');

    const metadata = options.includeMetadata ? `
      <div class="metadata">
        <h2>Document Information</h2>
        <p><strong>Title:</strong> ${this.escapeHtml(document.title)}</p>
        <p><strong>Created:</strong> ${document.createdAt.toLocaleDateString()}</p>
        <p><strong>Last Modified:</strong> ${document.updatedAt.toLocaleDateString()}</p>
        <p><strong>Word Count:</strong> ${document.wordCount}</p>
      </div>
      <hr>
    ` : '';

    const statistics = options.includeStatistics ? `
      <hr>
      <div class="statistics">
        <h2>Document Statistics</h2>
        <p><strong>Words:</strong> ${document.wordCount}</p>
        <p><strong>Characters:</strong> ${document.content.length}</p>
        <p><strong>Paragraphs:</strong> ${document.content.split('\n\n').filter(p => p.trim().length > 0).length}</p>
      </div>
    ` : '';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(document.title)}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .metadata, .statistics {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .metadata h2, .statistics h2 {
            margin-top: 0;
            color: #34495e;
        }
        p {
            margin-bottom: 16px;
            text-align: justify;
        }
        hr {
            border: none;
            height: 1px;
            background: #ddd;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <h1>${this.escapeHtml(document.title)}</h1>
    ${metadata}
    <div class="content">
        ${content}
    </div>
    ${statistics}
</body>
</html>`;

    this.downloadFile(html, fileName, 'text/html');
  }

  // Export as RTF (Rich Text Format)
  private exportAsRtf(document: Document, fileName: string, options: ExportOptions): void {
    let rtfContent = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}';
    
    if (options.includeMetadata) {
      rtfContent += '\\f0\\fs24\\b ' + this.escapeRtf(document.title) + '\\b0\\par\\par';
      rtfContent += 'Created: ' + document.createdAt.toLocaleDateString() + '\\par';
      rtfContent += 'Last Modified: ' + document.updatedAt.toLocaleDateString() + '\\par';
      rtfContent += 'Word Count: ' + document.wordCount + '\\par\\par';
      rtfContent += '\\line\\par';
    }
    
    // Convert content to RTF format
    const paragraphs = document.content.split('\n\n').filter(p => p.trim().length > 0);
    paragraphs.forEach(paragraph => {
      rtfContent += this.escapeRtf(paragraph) + '\\par\\par';
    });
    
    if (options.includeStatistics) {
      rtfContent += '\\line\\par';
      rtfContent += '\\b Document Statistics:\\b0\\par';
      rtfContent += 'Words: ' + document.wordCount + '\\par';
      rtfContent += 'Characters: ' + document.content.length + '\\par';
      rtfContent += 'Paragraphs: ' + paragraphs.length + '\\par';
    }
    
    rtfContent += '}';

    this.downloadFile(rtfContent, fileName, 'application/rtf');
  }

  // Export as DOCX (requires external library)
  private async exportAsDocx(document: Document, fileName: string, options: ExportOptions): Promise<void> {
    // Note: This would require a library like docx.js or similar
    // For now, we'll provide a fallback to RTF
    console.warn('DOCX export requires additional library. Falling back to RTF format.');
    this.exportAsRtf(document, fileName.replace('.docx', '.rtf'), options);
  }

  // Export as PDF (requires external library)
  private async exportAsPdf(document: Document, fileName: string, options: ExportOptions): Promise<void> {
    // PDF export requires jsPDF library which isn't installed yet
    // For now, we'll fall back to HTML export
    console.warn('PDF export requires jsPDF library. Falling back to HTML format.');
    this.exportAsHtml(document, fileName.replace('.pdf', '.html'), options);
  }

  // Utility functions
  private generateFileName(title: string, format: ExportFormat): string {
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${sanitizedTitle}_${timestamp}.${format}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private escapeRtf(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\n/g, '\\par ');
  }

  private downloadFile(content: string, fileName: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // Get available export formats
  getAvailableFormats(): Array<{ value: ExportFormat; label: string; description: string }> {
    return [
      { value: 'txt', label: 'Plain Text (.txt)', description: 'Simple text format' },
      { value: 'html', label: 'Web Page (.html)', description: 'Formatted web document' },
      { value: 'rtf', label: 'Rich Text (.rtf)', description: 'Compatible with Word/Google Docs' },
      { value: 'docx', label: 'Word Document (.docx)', description: 'Microsoft Word format' },
      { value: 'pdf', label: 'PDF Document (.pdf)', description: 'Portable document format' }
    ];
  }
}

export const exportService = new ExportService(); 