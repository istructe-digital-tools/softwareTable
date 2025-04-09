function hideColumn(number) {
    const table = document.getElementById("softwareTable");
    const rows = table.rows;
    const cols = table.getElementsByTagName("col");
    const currentWidth = parseFloat(getComputedStyle(table).width);
    table.style.width = (currentWidth - 150) + "px";

    if (!table || number < 0 || number >= cols.length) return;

    // Step 1: Hide the column in all rows
    for (let i = 1; i < rows.length; i++) {
        const cell = rows[i].cells[number];
        if (cell) {
            cell.style.display = "none";
        }
    }

    // Step 2: Hide the <col> element
    if (cols[number]) {
        cols[number].style.display = "none";
    }

    // Step 3: Adjust the correct header group using 'value' (not current colspan!)
    const headerRow = table.querySelector(".headers");
    if (!headerRow) return;

    const thElements = headerRow.getElementsByTagName("th");

    let cumulativeColumn = 0;

    for (let i = 0; i < thElements.length; i++) {
        const th = thElements[i];
        const groupTotal = parseInt(th.getAttribute("value"), 10); // fixed group size
        let currentColspan = parseInt(th.getAttribute("colspan"), 10);

        const groupStart = cumulativeColumn;
        const groupEnd = cumulativeColumn + groupTotal - 1;

        if (number >= groupStart && number <= groupEnd) {
            const newColspan = currentColspan - 1;
            th.setAttribute("colspan", newColspan);
            if (newColspan <= 0) {
                th.style.display = "none";
            }
            break;
        }

        cumulativeColumn += groupTotal; // increment based on fixed value, not colspan
    }
}

function showColumn(number) {
    const table = document.getElementById("softwareTable");
    const rows = table.rows;
    const cols = table.getElementsByTagName("col");
    const currentWidth = parseFloat(getComputedStyle(table).width);
    table.style.width = (currentWidth + 150) + "px";
 
    if (!table || number < 0 || number >= cols.length) return;

    // Step 1: Show the column in all rows
    for (let i = 1; i < rows.length; i++) {
        const cell = rows[i].cells[number];
        if (cell) {
            cell.style.display = "";
        }
    }

    // Step 2: Show the <col> element
    if (cols[number]) {
        cols[number].style.display = "";
    }

    // Step 3: Adjust the headers
    const headerRow = table.querySelector(".headers");
    if (!headerRow) return;

    const thElements = headerRow.getElementsByTagName("th");

    let groupStartIndex = 0;

    for (let i = 0; i < thElements.length; i++) {
        const th = thElements[i];
        const fullGroupSize = parseInt(th.getAttribute("value"), 10); // total columns in group
        let currentColspan = parseInt(th.getAttribute("colspan"), 10);

        if (isNaN(fullGroupSize) || isNaN(currentColspan)) continue;

        const groupEndIndex = groupStartIndex + fullGroupSize - 1;

        // Check if column number falls within this group
        if (number >= groupStartIndex && number <= groupEndIndex) {
            const newColspan = currentColspan + 1;
            th.setAttribute("colspan", newColspan);
            if (newColspan > 0) {
                th.style.display = "";
            }
            break;
        }

        groupStartIndex += fullGroupSize;
    }
}

function hideType() {
    if (document.getElementById("typeButton").checked === false) {
        hideColumn(2);
    } else {
        showColumn(2);
    }
}

function hideComponents() {
    if (document.getElementById("componentsButton").checked === false) {
        hideColumn(4);
        hideColumn(3);
    } else {
        showColumn(4);
        showColumn(3);
    }
}

function hidePrice() {
    if (document.getElementById("priceButton").checked === false) {
        hideColumn(30);
    } else {
        showColumn(30);
    }
}

function hideMaterials() {
    if (document.getElementById("materialButton").checked === false) {
        hideColumn(13);
        hideColumn(12);
        hideColumn(11);
        hideColumn(10);
        hideColumn(9);
        hideColumn(8);
    } else {
        showColumn(13);
        showColumn(12);
        showColumn(11);
        showColumn(10);
        showColumn(9);
        showColumn(8);
    }
}

function hideCodes() {
    if (document.getElementById("codesButton").checked === false) {
        hideColumn(19);
        hideColumn(18);
        hideColumn(17);
        hideColumn(16);
        hideColumn(15);
        hideColumn(14);
    } else {
        showColumn(19);
        showColumn(18);
        showColumn(17);
        showColumn(16);
        showColumn(15);
        showColumn(14);
    }
}

function hideInterfaces() {
    if (document.getElementById("interfacesButton").checked === false) {
        hideColumn(23);
        hideColumn(22);
        hideColumn(21);
        hideColumn(20);
    } else {
        showColumn(23);
        showColumn(22);
        showColumn(21);
        showColumn(20);
    }
}

function hideSystem() {
    if (document.getElementById("systemButton").checked === false) {
        hideColumn(24);
        hideColumn(25);
    } else {
        showColumn(24);
        showColumn(25);
    }
}

function hideWeb() {
    if (document.getElementById("webButton").checked === false) {
        hideColumn(28);
    } else {
        showColumn(28);
    }
}

function hideRequires() {
    if (document.getElementById("requiresButton").checked === false) {
        hideColumn(26);
        hideColumn(27);
    } else {
        showColumn(26);
        showColumn(27);
    }
}
