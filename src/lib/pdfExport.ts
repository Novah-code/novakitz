import { DreamStats } from './monthlyReport';

/**
 * Generate PDF content as a data URL using canvas and basic HTML-to-image conversion
 * For production, consider using libraries like jspdf, html2canvas, or pdfkit
 */
export async function generateDreamPDF(
  dream: any,
  analysis: string,
  fileName: string = 'dream.pdf'
): Promise<void> {
  try {
    // For now, we'll create a simple HTML export and trigger a download
    // In production, use a library like jsPDF or html2pdf

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${dream.title || 'Dream Journal'}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }

          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #7fb069;
            padding-bottom: 20px;
          }

          .header h1 {
            font-size: 28px;
            color: #1f2937;
            margin-bottom: 8px;
          }

          .meta {
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f9fafb;
            border-radius: 8px;
            font-size: 14px;
          }

          .meta-item {
            text-align: center;
          }

          .meta-label {
            font-weight: 600;
            color: #7fb069;
            margin-bottom: 4px;
          }

          .meta-value {
            color: #4b5563;
          }

          .section {
            margin-bottom: 30px;
          }

          .section h2 {
            font-size: 18px;
            color: #7fb069;
            margin-bottom: 12px;
            border-left: 4px solid #7fb069;
            padding-left: 12px;
          }

          .section p {
            color: #4b5563;
            line-height: 1.8;
          }

          .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
          }

          .tag {
            display: inline-block;
            background-color: rgba(127, 176, 105, 0.1);
            color: #7fb069;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
          }

          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
          }

          @media print {
            body {
              padding: 0;
            }

            .header {
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${dream.title || 'My Dream'}</h1>
          <p style="color: #6b7280; margin-top: 8px;">Dream Journal Entry</p>
        </div>

        <div class="meta">
          <div class="meta-item">
            <div class="meta-label">Date</div>
            <div class="meta-value">${dream.date || new Date().toLocaleDateString()}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Time</div>
            <div class="meta-value">${dream.time || 'N/A'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Mood</div>
            <div class="meta-value">${dream.mood || 'Not specified'}</div>
          </div>
        </div>

        <div class="section">
          <h2>Dream Description</h2>
          <p>${(dream.content || dream.text || 'No content').replace(/\n/g, '<br>')}</p>
        </div>

        ${analysis ? `
          <div class="section">
            <h2>Analysis</h2>
            <p>${analysis.replace(/\n/g, '<br>')}</p>
          </div>
        ` : ''}

        ${dream.tags && dream.tags.length > 0 ? `
          <div class="section">
            <h2>Tags</h2>
            <div class="tags">
              ${dream.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <p>Generated from Novakitz Dream Journal</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.replace('.pdf', '.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generate Monthly Report PDF
 */
export async function generateMonthlyReportPDF(
  stats: DreamStats,
  insights: string,
  fileName: string = 'monthly-report.pdf'
): Promise<void> {
  try {
    const monthName = new Date().toLocaleString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Monthly Report - ${monthName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 40px;
            max-width: 900px;
            margin: 0 auto;
          }

          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #7fb069;
            padding-bottom: 20px;
          }

          .header h1 {
            font-size: 32px;
            color: #1f2937;
            margin-bottom: 8px;
          }

          .header p {
            color: #6b7280;
            font-size: 16px;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 40px;
          }

          .stat-card {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
          }

          .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #7fb069;
            margin-bottom: 8px;
          }

          .stat-label {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
          }

          .section {
            margin-bottom: 30px;
          }

          .section h2 {
            font-size: 20px;
            color: #7fb069;
            margin-bottom: 15px;
            border-left: 4px solid #7fb069;
            padding-left: 12px;
          }

          .keywords {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 12px;
          }

          .keyword {
            display: inline-block;
            background-color: rgba(127, 176, 105, 0.1);
            color: #7fb069;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
          }

          .insights {
            background-color: rgba(127, 176, 105, 0.05);
            border-left: 4px solid #7fb069;
            padding: 20px;
            border-radius: 8px;
            line-height: 1.8;
          }

          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
          }

          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Monthly Report</h1>
          <p>${monthName}</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.totalDreams}</div>
            <div class="stat-label">Dreams Recorded</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.totalAnalyzed}</div>
            <div class="stat-label">AI Analyzed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.averageMood.toFixed(1)}</div>
            <div class="stat-label">Average Mood</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.totalAffirmations}</div>
            <div class="stat-label">Affirmations Created</div>
          </div>
        </div>

        ${stats.topKeywords.length > 0 ? `
          <div class="section">
            <h2>Top Keywords</h2>
            <div class="keywords">
              ${stats.topKeywords.map(kw => `<span class="keyword">${kw.keyword} (${kw.count})</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${insights ? `
          <div class="section">
            <h2>Monthly Insights</h2>
            <div class="insights">
              ${insights.replace(/\n/g, '<br>')}
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <p>Generated from Novakitz Dream Journal</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.replace('.pdf', '.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating report PDF:', error);
    throw error;
  }
}
