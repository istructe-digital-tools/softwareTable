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

        // If sorting column 27, extract numeric values
        if (n === 27) {
            var numA = extractNumericValue(cellA);
            var numB = extractNumericValue(cellB);
            return ascending ? numA - numB : numB - numA;
        }

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
		// Tokenize search terms and text content
		var searchWords = filter.searchText.toLowerCase().trim().split(/\s+/);
		var cellWords = cellText.split(/\s+/);

		// Check if all search words appear somewhere in the cell text
		return searchWords.every(word => cellWords.some(cellWord => cellWord.includes(word)));
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
        "australia": 18,
        "canada": 18,
        "india": 18,
        "hong kong": 18,
        "new zealand": 18,
        "south africa": 18,
        "aci": 18,
        "aisc": 18,
        "aashto": 18,
        "international": 18,

        // Eurocode National Annexes (Countries)
        "united kingdom": 15,
        "ireland": 16,
        "belgium": 16,
        "cyprus": 16,
        "finland": 16,
        "france": 16,
        "denmark": 16,
        "germany": 16,
        "italy": 16,
        "malaysia": 16,
        "netherlands": 16,
        "norway": 16,
        "poland": 16,
        "singapore": 16,
        "spain": 16,
        "sweden": 16,
        "user defined": 16,

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
