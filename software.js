async function addSoftware() {
    const rowFiles = [
        "software/Database.html",
    ];

    const tableBody = document.getElementById("softwareTableBody");
    if (!tableBody) {
        console.error("Table body not found!");
        return;
    }

    try {
        console.log("Starting to load software rows...");

        const fetchPromises = rowFiles.map(file => {
            // Add cache-busting query string
            const url = `${file}?v=${Date.now()}`;
            return fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${file}: ${response.status}`);
                    }
                    return response.text();
                })
                .then(data => {
                    console.log(`Inserting row from ${file}`);
                    tableBody.insertAdjacentHTML("beforeend", data);
                })
                .catch(error => console.error("Error loading row:", file, error));
        });

        await Promise.all(fetchPromises);

        console.log("All rows added!");
        document.dispatchEvent(new Event('softwareAdded'));

        setTimeout(() => {
            console.log("Randomizing table rows...");
            randomizeTableRows();
        }, 0);

    } catch (error) {
        console.error("Error during software addition:", error);
    }
}
