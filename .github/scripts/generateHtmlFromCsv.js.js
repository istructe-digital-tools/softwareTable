const fs = require('fs');
const path = require('path');

const folder = './software';
let allRows = [];

fs.readdirSync(folder).forEach(file => {
    if (file.endsWith('.csv')) {
        const filePath = path.join(folder, file);
        const csvContent = fs.readFileSync(filePath, 'utf8');
        const rows = csvContent.trim().split('\n');
        allRows.push(...rows);
        console.log(`Included ${file}`);
    }
});

const htmlContent = csvToHtmlRows(allRows);
fs.writeFileSync(path.join(folder, 'software.html'), htmlContent, 'utf8');
console.log('Generated software.html');

function csvToHtmlRows(rows) {
    let html = '';

    rows.forEach(row => {
        const cells = parseCsvRow(row);
        html += '  <tr>\n';

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
            html += `    ${htmlCell}\n`;
        });

        html += '  </tr>\n';
    });

    return html;
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