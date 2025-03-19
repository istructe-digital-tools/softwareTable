function sortTable(n) {
    var table = document.getElementById("softwareTable");
    if (!table) {
        console.error("Table not found!");
        return;
    }

    var tbody = table.getElementsByTagName("tbody")[0]; // Get the table body
    if (!tbody) {
        console.error("Table body not found!");
        return;
    }

    var rows = Array.from(tbody.rows); // Convert rows to an array
    var ascending = table.dataset.sortOrder !== "asc"; // Toggle sort order

    // Sort rows based on the column index (n)
    rows.sort(function (rowA, rowB) {
        var cellA = rowA.cells[n].textContent.trim().toLowerCase();
        var cellB = rowB.cells[n].textContent.trim().toLowerCase();

        // Check if the values are numbers
        var numA = parseFloat(cellA);
        var numB = parseFloat(cellB);
        var isNumeric = !isNaN(numA) && !isNaN(numB);

        if (isNumeric) {
            return ascending ? numA - numB : numB - numA;
        } else {
            return ascending ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
        }
    });

    // Append sorted rows back to tbody
    tbody.innerHTML = "";
    rows.forEach(row => tbody.appendChild(row));

    // Store the sorting order
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

    const event = new Event('tableRandomized');
    document.dispatchEvent(event);
}

function filterTable() {
    var table = document.getElementById("softwareTable");
    if (!table) return;

    var form = document.getElementById("filterForm");
    var checkboxes = form.getElementsByTagName("input");

    var selectedFilters = [];
    for (var i = 0; i < checkboxes.length; i++) {
        var cb = checkboxes[i];
        if (cb.type === "checkbox" && cb.checked) {
            selectedFilters.push({
                columnIndex: getMaterialColumnIndex(cb.id),
                expectedValue: (cb.dataset.filter || "").toLowerCase().trim()
            });
        }
    }

    var rows = table.getElementsByTagName("tbody")[0].rows;
    var visibleRows = []; // Track visible rows for striping

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var showRow = selectedFilters.every(filter => {
            if (filter.columnIndex === -1) return true;

            var cell = row.cells[filter.columnIndex];
            if (!cell) return true;

            var cellText = cell.textContent.toLowerCase().trim();
	    if (cellText === "-" || cellText === "any") return true;
            return cellText.includes(filter.expectedValue);
        });

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

        // Pricing Structure
        "free": 32,
        "paid": 32,
        "subscription": 32,

        // Design Type
        "analysis": 4,
        "design": 4,
        "parametric": 4,
	"bim": 4,
	"carbon": 4,


        // Materials
        "concrete": 8,
        "masonry": 9,
        "steel": 10,
        "timber": 11,
        "polymers": 12,
        "composites": 13,

        // Sections
        "custom sections": 14,
        "custom profiles": 15,

	//Check level
	"full": 21,

        // Codes
        "eurocodes": 16,
        "british standards": 19,
        "aci": 20,
        "aisc": 20,
        "as": 20,
        "canadian": 20,
        "is": 20,

        // Eurocode National Annexes (Countries)
        "united kingdom": 17,
        "ireland": 18,
        "singapore": 18,
        "malaysia": 18,
        "finland": 18,
        "sweden": 18,
        "norway": 18,

        // Application Programming Interfaces
        "python": 22,
        "c#": 23,
        "grasshopper": 24,

        // Requirements
        "any": 26,
        "windows 10": 26,
        "windows 11": 26,
        "no internet access required": 30
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
