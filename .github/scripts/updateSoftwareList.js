const fs = require("fs");
const path = require("path");

const softwareDir = path.join(__dirname, "../../software"); // Adjusted path to the folder
const jsFilePath = path.join(__dirname, "../../yourScript.js"); // Update with your actual JS file

// Read all .html files in the "software" folder
const files = fs.readdirSync(softwareDir).filter(file => file.endsWith(".html"));

// Generate new JavaScript array content
const newArrayContent = `const rowFiles = [\n    "${files.join('",\n    "')}"\n];\n`;

// Read the JS file and replace the rowFiles array
let jsContent = fs.readFileSync(jsFilePath, "utf8");
jsContent = jsContent.replace(/const rowFiles = \[[^\]]*\];/, newArrayContent);

// Write the updated JS file
fs.writeFileSync(jsFilePath, jsContent, "utf8");

console.log("Updated software list in JavaScript file.");
