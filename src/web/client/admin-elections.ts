/// <reference path="./types.d.ts" />

// Admin elections page filtering
document.addEventListener("DOMContentLoaded", () => {
    const filterTabs = document.querySelectorAll<HTMLButtonElement>(".elections-filters .filter-tab");
    const searchInput = document.getElementById("electionSearch") as HTMLInputElement | null;
    const table = document.getElementById("electionsTable") as HTMLTableElement | null;
    const noResultsMessage = document.getElementById("noElectionsMessage") as HTMLElement | null;

    if (!table) return;

    const tableEl = table; // Non-null assertion for closure
    const rows = Array.from(tableEl.querySelectorAll<HTMLTableRowElement>("tbody tr"));
    let currentFilter = "all";

    function filterElections() {
        const searchTerm = searchInput?.value.toLowerCase() || "";
        let visibleCount = 0;

        rows.forEach((row) => {
            const status = row.dataset.status || "";
            const name = row.dataset.name || "";
            const type = row.dataset.type || "";

            const matchesFilter = currentFilter === "all" || status === currentFilter;
            const matchesSearch =
                !searchTerm || name.includes(searchTerm) || type.includes(searchTerm) || status.includes(searchTerm);

            if (matchesFilter && matchesSearch) {
                row.style.display = "";
                visibleCount++;
            } else {
                row.style.display = "none";
            }
        });

        // Show/hide no results message
        if (noResultsMessage) {
            noResultsMessage.style.display = visibleCount === 0 ? "flex" : "none";
        }

        // Show/hide table
        const tableContainer = tableEl.closest(".table-container");
        if (tableContainer) {
            (tableContainer as HTMLElement).style.display = visibleCount === 0 ? "none" : "";
        }
    }

    // Filter tab click handlers
    filterTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            filterTabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            currentFilter = tab.dataset.filter || "all";
            filterElections();
        });
    });

    // Search input handler
    if (searchInput) {
        searchInput.addEventListener("input", filterElections);
    }

    // Initialize Lucide icons
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
});
