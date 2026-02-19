/**
 * Admin results page - filtering and search functionality
 */

function initResultsFilter(): void {
    const tabs = document.querySelectorAll<HTMLButtonElement>(".filter-tab");
    const searchInput = document.getElementById("searchResults") as HTMLInputElement | null;
    const grid = document.getElementById("resultsGrid");
    const noResults = document.getElementById("noResultsMessage");

    if (!tabs.length || !grid) return;

    let activeFilter = "all";
    let searchQuery = "";

    function filterCards(): void {
        const cards = grid!.querySelectorAll<HTMLElement>(".result-card");
        let visibleCount = 0;

        cards.forEach((card) => {
            const status = card.dataset.status || "";
            const name = card.dataset.name || "";

            const matchesFilter = activeFilter === "all" || status === activeFilter;
            const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase());

            if (matchesFilter && matchesSearch) {
                card.style.display = "";
                visibleCount++;
            } else {
                card.style.display = "none";
            }
        });

        if (noResults) {
            noResults.style.display = visibleCount === 0 ? "flex" : "none";
        }
    }

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            activeFilter = tab.dataset.filter || "all";
            filterCards();
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            searchQuery = searchInput.value;
            filterCards();
        });
    }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    initResultsFilter();
});
