const fs = require('fs');
const path = require('path');

const folder = './software';

fs.readdirSync(folder).forEach(file => {
    if (file.endsWith('.csv')) {
        const filePath = path.join(folder, file);
        const csvContent = fs.readFileSync(filePath, 'utf8');
        const htmlContent = csvToHtmlTable(csvContent);

        const outputFile = path.join(folder, file.replace('.csv', '.html'));
        fs.writeFileSync(outputFile, htmlContent, 'utf8');
        console.log(`Converted ${file} -> ${path.basename(outputFile)}`);
    }
});

function csvToHtmlTable(csvString) {
    const rows = csvString.trim().split('\n');
    let tableHtml = '';

    rows.forEach((row, rowIndex) => {
        const cells = parseCsvRow(row);
        tableHtml += '  <tr>\n';

        cells.forEach((cell, i) => {
            let htmlCell;
            if (i === 7 || i === 29) {
                htmlCell = `<td><a target='_blank' href='${cell}'>link</a></td>`;
            } else {
                let content = cell
                    .replace(/\/#/g, '<br/>')
                    .replace(/\[/g, "<div class='tooltip'>")
                    .replace(/\]/g, "*</div>")
                    .replace(/{/g, "<span class='tooltip-text'>")
                    .replace(/}/g, "</span>");
                htmlCell = `<td>${content}</td>`;
            }
            tableHtml += `    ${htmlCell}\n`;
        });

        tableHtml += '  </tr>\n';
    });

    return tableHtml;
}

function parseCsvRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        const next = row[i + 1];

        if (char === '"' && inQuotes && next === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}
