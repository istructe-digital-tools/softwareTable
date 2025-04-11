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
    var btn = document.getElementById("typeButton")
    if (btn.innerText === "◀") {
        hideColumn(2);
	btn.innerText = "▶";
    } else {
        showColumn(2);
	btn.innerText = "◀";
    }
}

function hideComponents() {
    var btn = document.getElementById("componentsButton");
    if (btn.innerText === "◀") {
        hideColumn(4);
        hideColumn(3);
        btn.innerText = "▶";
    } else {
        showColumn(4);
        showColumn(3);
        btn.innerText = "◀";
    }
}


function hidePrice() {
    var btn = document.getElementById("priceButton");
    if (btn.innerText === "◀") {
        hideColumn(30);
        btn.innerText = "▶";
    } else {
        showColumn(30);
        btn.innerText = "◀";
    }
}

function hideMaterials() {
    var btn = document.getElementById("materialButton");
    if (btn.innerText === "◀") {
        [13, 12, 11, 10, 9, 8].forEach(hideColumn);
        btn.innerText = "▶";
    } else {
        [13, 12, 11, 10, 9, 8].forEach(showColumn);
        btn.innerText = "◀";
    }
}

function hideCodes() {
    var btn = document.getElementById("codesButton");
    if (btn.innerText === "◀") {
        [19, 18, 17, 16, 15, 14].forEach(hideColumn);
        btn.innerText = "▶";
    } else {
        [19, 18, 17, 16, 15, 14].forEach(showColumn);
        btn.innerText = "◀";
    }
}

function hideInterfaces() {
    var btn = document.getElementById("interfacesButton");
    if (btn.innerText === "◀") {
        [23, 22, 21, 20].forEach(hideColumn);
        btn.innerText = "▶";
    } else {
        [23, 22, 21, 20].forEach(showColumn);
        btn.innerText = "◀";
    }
}

function hideSystem() {
    var btn = document.getElementById("systemButton");
    if (btn.innerText === "◀") {
        [24, 25].forEach(hideColumn);
        btn.innerText = "▶";
    } else {
        [24, 25].forEach(showColumn);
        btn.innerText = "◀";
    }
}

function hideRequires() {
    var btn = document.getElementById("requiresButton");
    if (btn.innerText === "◀") {
        [26, 27, 28].forEach(hideColumn);
        btn.innerText = "▶";
    } else {
        [26, 27, 28].forEach(showColumn);
        btn.innerText = "◀";
    }
}

