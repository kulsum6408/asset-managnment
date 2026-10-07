/**
 * Export Utility for Asset Management System
 * Generates CSV, Excel-compatible XML/CSV, and PDF formatted reports from MySQL records.
 */

function sanitizeVal(val) {
    if (val === null || val === undefined) return "";
    let str = String(val).replace(/"/g, '""');
    if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str}"`;
    }
    return str;
}

// 1. Generate CSV string
function generateCSV(rows, columns = null) {
    if (!rows || rows.length === 0) return "No data available\n";

    const keys = columns || Object.keys(rows[0]).filter(k => !["password", "jwt_secret", "token"].includes(k));
    const headerRow = keys.map(k => sanitizeVal(k)).join(",");

    const dataRows = rows.map(row => {
        return keys.map(k => sanitizeVal(row[k])).join(",");
    });

    return [headerRow, ...dataRows].join("\n");
}

// 2. Generate Excel XML string (Excel compatible)
function generateExcelXML(rows, title = "Asset Management Report", columns = null) {
    if (!rows || rows.length === 0) {
        return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Sheet1"><Table><Row><Cell><Data ss:Type="String">No data available</Data></Cell></Row></Table></Worksheet></Workbook>`;
    }

    const keys = columns || Object.keys(rows[0]).filter(k => !["password", "jwt_secret", "token"].includes(k));

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${title.replace(/[^\w]/g, '_')}">
  <Table>
   <Row ss:StyleID="Header">
`;
    keys.forEach(k => {
        xml += `    <Cell><Data ss:Type="String">${k.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>\n`;
    });
    xml += `   </Row>\n`;

    rows.forEach(row => {
        xml += `   <Row>\n`;
        keys.forEach(k => {
            const val = row[k] === null || row[k] === undefined ? "" : String(row[k]).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const type = typeof row[k] === "number" ? "Number" : "String";
            xml += `    <Cell><Data ss:Type="${type}">${val}</Data></Cell>\n`;
        });
        xml += `   </Row>\n`;
    });

    xml += `  </Table>\n </Worksheet>\n</Workbook>`;
    return xml;
}

// 3. Generate Simple PDF Document Buffer (ASCII/Binary PDF Generator without native dependencies)
function generatePDF(rows, title = "Asset Management Report", columns = null) {
    if (!rows || rows.length === 0) {
        rows = [{ Message: "No data available" }];
    }

    const keys = columns || Object.keys(rows[0]).filter(k => !["password", "jwt_secret", "token"].includes(k));

    // Construct simple PDF text representation
    let textLines = [];
    textLines.push(`=================================================================`);
    textLines.push(`  ${title.toUpperCase()}`);
    textLines.push(`  Generated at: ${new Date().toISOString()}`);
    textLines.push(`=================================================================\n`);

    rows.forEach((row, idx) => {
        textLines.push(`--- Record #${idx + 1} ---`);
        keys.forEach(k => {
            textLines.push(`  ${k}: ${row[k] !== null && row[k] !== undefined ? row[k] : ''}`);
        });
        textLines.push(``);
    });

    const contentStr = textLines.join("\n");

    // Minimal PDF 1.4 specification structure
    const streamContent = `BT /F1 10 Tf 40 780 Td 12 TL\n` +
        contentStr.split("\n").map(l => {
            const escaped = l.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
            return `(${escaped}) '`;
        }).join("\n") +
        `\nET`;

    const streamLength = Buffer.byteLength(streamContent);

    const pdf = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /Resources <</Font <</F1 4 0 R>>>> /MediaBox [0 0 595 842] /Contents 5 0 R>> endobj
4 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
5 0 obj <</Length ${streamLength}>>
stream
${streamContent}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000244 00000 n 
0000000312 00000 n 
trailer <</Size 6 /Root 1 0 R>>
startxref
${370 + streamLength}
%%EOF`;

    return Buffer.from(pdf, "binary");
}

module.exports = { generateCSV, generateExcelXML, generatePDF };
