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
	
	if (input.id === "Plug In"){
	    if(input.checked === true){
		plugIn = true;
		document.getElementById("Secondary Software").style.visibility = "visible";
	    }
	    else {
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
        var showRow = selectedFilters.every(filter => {
            if (filter.columnIndex === -1) return true;

            var cell = row.cells[filter.columnIndex];
            if (!cell) return true;

            var cellText = cell.textContent.toLowerCase().trim();

            if (cellText === "-" || cellText === "any") return true;

            // Text filters (checkboxes)
            if (filter.type === "text") {
                return cellText.includes(filter.expectedValue);
            }

            // Search filter for Features
            else if (filter.type === "search") {
                return cellText.includes(filter.searchText);
            }

            // Number filters (RAM, Storage)
            else if (filter.type === "number") {
                var cellValue = extractNumericValue(cellText);
                return !isNaN(cellValue) && cellValue <= filter.maxValue;
            }

            return true;
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

// Helper function to extract numeric values from "10 GB", "512 MB", etc.
function extractNumericValue(text) {
    var match = text.match(/[\d\.]+/); // Extracts numbers including decimals
    return match ? parseFloat(match[0]) : NaN;
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
        "free": 32,
        "paid": 32,
        "subscription": 32,

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
        "ram": 28,
        "storage": 29,
        "no internet access required": 30,
        "secondary software": 33
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
