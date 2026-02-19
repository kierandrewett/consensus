import { createIcons, icons } from "lucide";

// Debounce to avoid excessive re-renders
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function refreshIcons() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        createIcons({ icons });
    }, 10);
}

// Initialize icons when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        createIcons({ icons });
        observeMutations();
    });
} else {
    createIcons({ icons });
    observeMutations();
}

// Watch for DOM changes and reinitialize icons
function observeMutations() {
    const observer = new MutationObserver((mutations) => {
        let shouldRefresh = false;

        for (const mutation of mutations) {
            // Check added nodes
            if (mutation.type === "childList") {
                for (const node of mutation.addedNodes as any) {
                    if (node instanceof Element) {
                        // Check if node or its descendants have data-lucide
                        if (node.hasAttribute("data-lucide") || node.querySelector("[data-lucide]")) {
                            shouldRefresh = true;
                            break;
                        }
                    }
                }
            }
            if (shouldRefresh) break;
        }

        if (shouldRefresh) {
            refreshIcons();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

// Export for manual initialization if needed
export { createIcons, icons };
