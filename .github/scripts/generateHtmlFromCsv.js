const fs = require('fs');
const path = require('path');

// Path to the folder containing CSV files
const folder = './software';
let allRows = [];

// Check if the folder exists
if (!fs.existsSync(folder)) {
    console.error(`Error: Folder ${folder} does not exist.`);
    process.exit(1);
}

// Read the CSV files and process them
fs.readdirSync(folder).forEach(file => {
    if (file.endsWith('.csv')) {
        const filePath = path.join(folder, file);
        const csvContent = fs.readFileSync(filePath, 'utf8');
        const rows = csvContent.trim().split('\n');
        allRows.push(...rows);
        console.log(`Included ${file}`);
    }
});

// If no rows were added, log an error and exit
if (allRows.length === 0) {
    console.error('No CSV data found. Exiting.');
    process.exit(1);
}

// Convert CSV rows to HTML table rows
const htmlContent = csvToHtmlRows(allRows);

// Ensure the 'software' subfolder exists, create it if necessary
const outputDir = path.join(__dirname, '..', 'software');

// Create the 'software' folder if it does not exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Output file path (within the 'software' subfolder)
const outputFilePath = path.join(outputDir, 'Database.html');

// Write the HTML content to the file
fs.writeFileSync(outputFilePath, htmlContent, 'utf8');
console.log(`Generated ${outputFilePath}`);

// Function to convert CSV rows to HTML table rows
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

// Function to parse each CSV row into individual cells
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
