document.addEventListener("DOMContentLoaded", function () {
    const rowFiles = [
        "softwarePanel.html",
	"softwareTrimble.html",
	"softwareFoundaxisLLC.html",
    ];

    const tableBody = document.getElementById("softwareTableBody");

    rowFiles.forEach(file => {
        fetch(file)
            .then(response => response.text())
            .then(data => {
                tableBody.innerHTML += data;
            })
            .catch(error => console.error("Error loading row:", file, error));
    });

    randomizeTableRows();

    var form = document.getElementById("filterForm");
    if (form) {
        form.addEventListener("change", filterTable);
    }

    sortTable(6);
});
