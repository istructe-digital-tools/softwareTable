async function addSoftware() { 
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

    try {
        // Create an array of promises for each fetch request
        const fetchPromises = rowFiles.map(file => 
            fetch(file)
                .then(response => response.text())
                .then(data => {
                    tableBody.insertAdjacentHTML("beforeend", data);
                })
                .catch(error => console.error("Error loading row:", file, error))
        );

        // Wait for all the fetch promises to resolve
        await Promise.all(fetchPromises);

        // Dispatch the event after all rows are added
        const event = new Event('softwareAdded');
        document.dispatchEvent(event);

    } catch (error) {
        console.error("Error during software addition:", error);
    }
}
