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
        // Log to verify when the process starts
        console.log("Starting to load software rows...");

        // Create an array of promises for each fetch request
        const fetchPromises = rowFiles.map(file => 
            fetch(file)
                .then(response => response.text())
                .then(data => {
                    console.log(`Inserting row from ${file}`);
                    tableBody.insertAdjacentHTML("beforeend", data);
                })
                .catch(error => console.error("Error loading row:", file, error))
        );

        // Wait for all the fetch promises to resolve
        await Promise.all(fetchPromises);

        // Log after rows are added
        console.log("All rows added!");

        // Dispatch the event after all rows are added
        const event = new Event('softwareAdded');
        document.dispatchEvent(event);

        // Ensure the DOM is updated by deferring the randomization to the next event loop
        setTimeout(() => {
            console.log("Randomizing table rows...");
            randomizeTableRows(); // Randomize the table rows after all rows are added
        }, 0); 

    } catch (error) {
        console.error("Error during software addition:", error);
    }
}
