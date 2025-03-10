const fs = require("fs");
const path = require("path");

const softwareDir = path.join(__dirname, "../../software");
const jsFilePath = path.join(__dirname, "../../software.js");

// Ensure the JavaScript file exists
if (!fs.existsSync(jsFilePath)) {
    console.error(`Error: JavaScript file not found at ${jsFilePath}`);
    process.exit(1);
}

// Read all .html files from the "software" folder
const files = fs.readdirSync(softwareDir).filter(file => file.endsWith(".html"));

// Generate the `rowFiles` array with the correct folder path
const newArrayContent = `const rowFiles = [\n    "${files.map(file => `software/${file}`).join('",\n    "')}"\n];\n`;

// Read `software.js` and replace the `rowFiles` array
let jsContent = fs.readFileSync(jsFilePath, "utf8");
jsContent = jsContent.replace(/const rowFiles = \[[^\]]*\];/, newArrayContent);

// Write the updated file back
fs.writeFileSync(jsFilePath, jsContent, "utf8");

console.log("✅ Updated software.js with correct software folder paths.");
