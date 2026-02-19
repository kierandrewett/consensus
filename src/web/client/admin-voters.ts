/**
 * Admin voters page - filtering and search functionality
 */

function initVotersFilter(): void {
    const tabs = document.querySelectorAll<HTMLButtonElement>(".voters-filters .filter-tab");
    const searchInput = document.getElementById("voterSearch") as HTMLInputElement | null;
    const table = document.getElementById("votersTable") as HTMLTableElement | null;
    const noResults = document.getElementById("noVotersMessage");

    if (!tabs.length || !table) return;

    let activeFilter = "all";
    let searchQuery = "";

    function filterRows(): void {
        const rows = table!.querySelectorAll<HTMLTableRowElement>("tbody tr");
        let visibleCount = 0;

        rows.forEach((row) => {
            const status = row.dataset.status || "";
            const name = row.dataset.name || "";
            const email = row.dataset.email || "";

            const matchesFilter = activeFilter === "all" || status === activeFilter;
            const matchesSearch =
                !searchQuery || name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());

            if (matchesFilter && matchesSearch) {
                row.style.display = "";
                visibleCount++;
            } else {
                row.style.display = "none";
            }
        });

        if (noResults) {
            noResults.style.display = visibleCount === 0 ? "flex" : "none";
        }

        // Hide table if no results
        if (table) {
            table.style.display = visibleCount === 0 ? "none" : "";
        }
    }

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            activeFilter = tab.dataset.filter || "all";
            filterRows();
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            searchQuery = searchInput.value;
            filterRows();
        });
    }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    initVotersFilter();
});
