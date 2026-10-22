/**
 * Utility to export tabular data to CSV format with UTF-8 BOM
 * ensuring full compatibility with Microsoft Excel, Google Sheets, and LibreOffice Calc.
 */

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  // Add UTF-8 BOM so Excel opens special characters (tildes, ñ) correctly
  const BOM = '\uFEFF';
  
  const escapeCell = (cell: string | number | null | undefined): string => {
    if (cell === null || cell === undefined) return '""';
    const cellStr = String(cell);
    // If cell contains semicolon, comma, newline, or double quote, quote it
    if (cellStr.includes(';') || cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
      return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return `"${cellStr}"`;
  };

  // We use semicolon ';' as separator which is standard for Chilean & Latin American locale Excel spreadsheets
  const separator = ';';

  const headerLine = headers.map(escapeCell).join(separator);
  const dataLines = rows.map((row) => row.map(escapeCell).join(separator));
  
  const csvContent = BOM + [headerLine, ...dataLines].join('\r\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
