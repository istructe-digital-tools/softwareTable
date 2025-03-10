const fs = require("fs");
const path = require("path");

const softwareDir = path.join(__dirname, "../../software"); // Path to software folder
const jsFilePath = path.join(__dirname, "../../software.js"); // Corrected path to software.js

// Check if software.js exists
if (!fs.existsSync(jsFilePath)) {
    console.error(`Error: JavaScript file not found at ${jsFilePath}`);
    process.exit(1);
}

// Read all .html files in the "software" folder
const files = fs.readdirSync(softwareDir).filter(file => file.endsWith(".html"));

// Generate new JavaScript array content
const newArrayContent = `const rowFiles = [\n    "${files.join('",\n    "')}"\n];\n`;

// Read software.js and replace the rowFiles array
let jsContent = fs.readFileSync(jsFilePath, "utf8");
jsContent = jsContent.replace(/const rowFiles = \[[^\]]*\];/, newArrayContent);

// Write the updated JS file
fs.writeFileSync(jsFilePath, jsContent, "utf8");

console.log("✅ Updated software.js with latest software files.");

