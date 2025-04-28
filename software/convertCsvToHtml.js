const fs = require('fs');
const path = require('path');

// Function to handle the conversion of the row
const convertRow = (row) => {
    return row.map((cell, index) => {
        if (index === 7 || index === 29) {
            return `<td><a target='_blank' href='${cell}'>link</a></td>`;
        } else {
            // Handle other columns
            return `<td>${cell.replace('[', "<div class='tooltip'>")
                                .replace(']', "*</div>")
                                .replace('{', "<span class='tooltip-text'>")
                                .replace('}', "</span>")
                                .replace('/#', "<br/>")}</td>`;
        }
    }).join('');
};

// Adjusted path: if the script and CSV are in the same "software" directory
const inputCsvFile = path.join(__dirname, 'Database.csv');
const outputHtmlFile = path.join(__dirname, 'Database.html');
let htmlContent = '';

// Function to parse CSV correctly, handling commas inside quotes
const parseCSV = (data) => {
    const rows = [];
    const regex = /(?:,|\r?\n|^)(?:"([^"]*)"|([^",\r\n]*))/g;
    let match;
    let row = [];
    
    let i = 0;
    while ((match = regex.exec(data)) !== null) {
        const cell = match[1] || match[2];  // Capture value inside quotes or regular cell
        row.push(cell);
        
        if (data.charAt(match.index + match[0].length) === '\n' || regex.lastIndex === data.length) {
            rows.push(row);
            row = [];
        }
    }

    return rows;
};

// Read the CSV file
fs.readFile(inputCsvFile, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the CSV file:', err);
        return;
    }

    // Parse the CSV content using our custom parser
    const rows = parseCSV(data);

    // Loop through each row in the parsed CSV
    rows.forEach(row => {
        // Convert the row to HTML and append to the HTML content
        htmlContent += `<tr>${convertRow(row)}</tr>\n`;
    });

    // Combine the header, rows, and footer to generate final HTML
    const finalHtml = htmlContent;

    // Write to the HTML file
    fs.writeFileSync(outputHtmlFile, finalHtml, 'utf8');
    console.log('Database.html has been generated');
});
