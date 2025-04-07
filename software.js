async function addSoftware() { 
    const rowFiles = [
    "software/BHoM.html",
    "software/BuildingTransparency.html",
    "software/CLTToolBox.html",
    "software/ElliottWood.html",
    "software/FoundaxisLLC.html",
    "software/HBert.html",
    "software/Karamba.html",
    "software/MasterSeries.html",
    "software/Oasys.html",
    "software/OneClickLCA.html",
    "software/ProektsoftEOOD.html",
    "software/Rhino.html",
    "software/Structx.html",
    "software/Trimble.html",
    "software/WhitbyWood.html",
    "software/beaconThorntonTomasetti.html",
    "software/concreteCenter.html"
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