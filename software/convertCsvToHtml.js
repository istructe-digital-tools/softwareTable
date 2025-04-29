const fs = require('fs');
const path = require('path');

// Function to handle the conversion of the row
const convertRow = (row) => {
    return row.map((cell, index) => {
        if (index === 7 || index === 29) {
            // Handle URLs in the 8th and 30th columns
            return `<td><a target='_blank' href='${cell}'>link</a></td>`;
        } else {
            // Handle all other conversions in all columns
            return `<td>${convertTooltips(cell)}</td>`;
        }
    }).join('');
};

// Function to replace the specified characters in the cell
const replaceSpecialChars = (cell) => {
    // First, replace all occurrences of the specified characters
    return cell.replace(/\/#/g, "<br/>")          // Replace "/#" with <br/>
               .replace(/\[/g, "<div class='tooltip'>")   // Replace "[" with tooltip start
               .replace(/\]/g, "</div>")       // Replace "]" with tooltip end
               .replace(/\{/g, "*<span class='tooltip-text'>") // Replace "{" with tooltip text start
               .replace(/\}/g, "</span>");      // Replace "}" with tooltip text end
};

// Function to handle tooltip and line break conversions
const convertTooltips = (cell) => {
    // Replace the special characters first
    let modifiedCell = replaceSpecialChars(cell);
    return modifiedCell;
};

// Adjusted path: if the script and CSV are in the same "software" directory
const inputCsvFile = path.join(__dirname, 'Database.csv');
const outputHtmlFile = path.join(__dirname, 'Database.html');
let htmlContent = '';

// Function to parse CSV, handling commas inside quotes
const parseCSV = (data) => {
    const rows = [];
    let row = [];
    let insideQuotes = false;
    let currentCell = '';

    for (let i = 0; i < data.length; i++) {
        const char = data[i];

        if (char === '"') {
            // Toggle the insideQuotes flag when encountering a quote mark
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            // If not inside quotes, treat comma as a separator
            row.push(currentCell.trim());
            currentCell = '';
        } else if (char === '\n' && !insideQuotes) {
            // If not inside quotes, treat newline as row separator
            row.push(currentCell.trim());
            rows.push(row);
            row = [];
            currentCell = '';
        } else {
            // Add the character to the current cell
            currentCell += char;
        }
    }

    // Push the last cell and row after the loop ends
    if (currentCell.length > 0 || row.length > 0) {
        row.push(currentCell.trim());
        rows.push(row);
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
