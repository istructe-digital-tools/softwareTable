function sortTable(n) {
    var table = document.getElementById("softwareTable");
    if (!table) {
        console.error("Table not found!");
        return;
    }

    var tbody = table.getElementsByTagName("tbody")[0];
    if (!tbody) {
        console.error("Table body not found!");
        return;
    }

    var rows = Array.from(tbody.rows);
    var ascending = table.dataset.sortOrder !== "asc";

    rows.sort(function (rowA, rowB) {
        var cellA = rowA.cells[n].textContent.trim().toLowerCase();
        var cellB = rowB.cells[n].textContent.trim().toLowerCase();

        // Push "-" to the bottom
        if (cellA === "-") return 1;
        if (cellB === "-") return -1;

        // If sorting column 27, use unit-aware extraction
        if (n === 27) {
            var numA = extractNumericValue(cellA);
            var numB = extractNumericValue(cellB);
            return ascending ? numA - numB : numB - numA;
        }

        // Regular numeric sort
        var numA = parseFloat(cellA);
        var numB = parseFloat(cellB);
        var isNumeric = !isNaN(numA) && !isNaN(numB);

        if (isNumeric) {
            return ascending ? numA - numB : numB - numA;
        } else {
            return ascending ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
        }
    });

    tbody.innerHTML = "";
    rows.forEach(row => tbody.appendChild(row));
    table.dataset.sortOrder = ascending ? "asc" : "desc";

    filterTable();
}



function randomizeTableRows() {
    var table = document.getElementById("softwareTable");
    if (!table) return;

    var tbody = table.getElementsByTagName("tbody")[0];
    var rows = Array.from(tbody.rows); // Convert HTMLCollection to array

    // Shuffle rows using Fisher-Yates shuffle
    for (let i = rows.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        tbody.appendChild(rows[j]); // Move row to new position
    }

    sortTable(6);
    sortTable(6);
    sortTable(19);
    sortTable(5);

    const event = new Event('tableRandomized');
    document.dispatchEvent(event);
}

function filterTable() {
    var table = document.getElementById("softwareTable");
    if (!table) return;

    var form = document.getElementById("filterForm");
    var inputs = form.getElementsByTagName("input");

    var selectedFilters = [];
    var plugIn = false;

    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];

        // Handle checkboxes
        if (input.type === "checkbox" && input.checked) {
            selectedFilters.push({
                columnIndex: getMaterialColumnIndex(input.id),
                expectedValue: (input.dataset.filter || "").toLowerCase().trim(),
                type: "text"
            });
        }

        if (input.id === "Plug In") {
            if (input.checked === true) {
                plugIn = true;
                document.getElementById("Secondary Software").style.visibility = "visible";
            } else {
                document.getElementById("Secondary Software").style.visibility = "hidden";
            }
        }

        if ((input.id === "Features" || (input.id === "Secondary Software" && plugIn)) && input.value.trim() !== "") {
            selectedFilters.push({
                columnIndex: getMaterialColumnIndex(input.id),
                searchText: input.value.toLowerCase().trim(),
                type: "search"
            });
        }

        if ((input.id === "Country") && input.value.trim() !== "") {
            selectedFilters.push({
                columnIndices: [16, 18],
                searchText: input.value.toLowerCase().trim(),
                type: "multisearch"
            });
        }

        // Handle numeric filtering for RAM and Storage
        if ((input.id === "RAM" || input.id === "Storage") && input.value.trim() !== "") {
            selectedFilters.push({
                columnIndex: getMaterialColumnIndex(input.id),
                maxValue: parseFloat(input.value),
                type: "number"
            });
        }
    }

    var rows = table.getElementsByTagName("tbody")[0].rows;
    var visibleRows = []; // Track visible rows for striping

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var showRow = true;

        for (let filter of selectedFilters) {
            if (filter.type === "multisearch") {
                const match = filter.columnIndices.some(index => {
                    const cell = row.cells[index];
                    if (!cell) return false;
                    const text = cell.textContent.toLowerCase().trim();
                    return text !== "-" && text !== "any" && text.includes(filter.searchText);
                });
                if (!match) {
                    showRow = false;
                    break;
                }
            } else {
                var cell = row.cells[filter.columnIndex];
                if (!cell) continue;

                var cellText = cell.textContent.toLowerCase().trim();
                if (cellText === "-" || cellText === "any") continue;

                if (filter.type === "text") {
                    if (!cellText.includes(filter.expectedValue)) {
                        showRow = false;
                        break;
                    }
                } else if (filter.type === "search") {
                    var searchWords = filter.searchText.split(/\s+/);
                    var cellWords = cellText.split(/\s+/);
                    if (!searchWords.every(word => cellWords.some(cellWord => cellWord.includes(word)))) {
                        showRow = false;
                        break;
                    }
                } else if (filter.type === "number") {
                    var cellValue = extractNumericValue(cellText);
                    if (isNaN(cellValue) || cellValue > filter.maxValue) {
                        showRow = false;
                        break;
                    }
                }
            }
        }

        row.style.display = showRow ? "" : "none";
        if (showRow) {
            visibleRows.push(row);
        }
    }

    // Reapply striping only to visible rows
    for (var i = 0; i < visibleRows.length; i++) {
        visibleRows[i].style.backgroundColor = i % 2 === 0 ? "#ffffff1a" : "#389c711a";
    }
}


// Helper function to extract numeric values and convert to GB if necessary
function extractNumericValue(text) {
    var match = text.match(/[\d\.]+/); // Extracts numbers including decimals
    if (!match) return NaN; // Return NaN if no number is found

    var value = parseFloat(match[0]); // Convert extracted number to float
    text = text.toUpperCase(); // Normalize units to uppercase for consistency

    if (text.includes("GB")) {
        return value; // No conversion needed
    } else if (text.includes("MB")) {
        return value / 1000; // Convert MB to GB
    } else if (text.includes("KB")) {
        return value / 1000000; // Convert KB to GB
    } else {
        return 0; // If no recognized unit, return 0
    }
}




// Helper function to get column index
function getMaterialColumnIndex(filter) {
    var columnMap = {

        // Compliance and Certification
        "certified by qualified engineer": 5,
        "iso 9001 compliant": 6,

        // Software Type
        "stand alone": 2,
        "plug in": 2,
        "website": 2,
        "spreadsheet": 2,
        "mobile app": 2,

        // Pricing Structure
        "free": 30,
        "paid": 30,
        "subscription": 30,

        // Design Type
        "features": 4,

        // Design Type
        "analysis": 3,
        "design": 3,
        "parametric": 3,
	"bim": 3,
	"carbon": 3,


        // Materials
        "concrete": 8,
        "masonry": 9,
        "steel": 10,
        "timber": 11,
        "polymers": 12,
        "composites": 13,


	//Check level
	"full": 19,

        // Codes
        "eurocodes": 14,
        "british standards": 17,
	"country": 18,


        // Eurocode National Annexes (Countries)
        "united kingdom": 15,
        "ireland": 16,


        // Application Programming Interfaces
        "python": 20,
        "c#": 21,
        "grasshopper": 22,

        // Requirements
        "any": 24,
        "windows 10": 24,
        "windows 11": 24,
        "ram": 26,
        "storage": 27,
        "no internet access required": 28,
        "secondary software": 31
    };

    return columnMap[filter.toLowerCase()] !== undefined ? columnMap[filter.toLowerCase()] : -1;
}

function enforceSingleSelection(category, clickedCheckbox) {
    // Get all checkboxes within the same category
    let checkboxes = document.querySelectorAll(`input[name="${category}"]`);
    
    // Uncheck all except the clicked one
    checkboxes.forEach(checkbox => {
        if (checkbox !== clickedCheckbox) {
            checkbox.checked = false;
        }
    });

    // Call your filtering function
    filterTable();
}
