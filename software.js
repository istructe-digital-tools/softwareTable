function addSoftware() { 
    const rowFiles = [
        "softwarePanel.html",
        "softwareTrimble.html",
        "softwareFoundaxisLLC.html"
    ];

    const tableBody = document.getElementById("softwareTableBody");
    if (!tableBody) {
        console.error("Table body not found!");
        return;
    }

    rowFiles.forEach(file => {
        fetch(file)
            .then(response => response.text())
            .then(data => {
                tableBody.insertAdjacentHTML("beforeend", data);
            })
            .catch(error => console.error("Error loading row:", file, error));
    });
}
