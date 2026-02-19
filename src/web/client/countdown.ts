/**
 * Countdown timer utilities for election end dates
 */

interface CountdownConfig {
    selector: string;
    endingClass: string;
    closingText: string;
}

function formatCountdown(diff: number): string {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

function updateCountdowns(config: CountdownConfig): void {
    const countdowns = document.querySelectorAll<HTMLElement>(config.selector);
    const now = Date.now();

    countdowns.forEach((el) => {
        const endDateStr = el.dataset.end;
        if (!endDateStr) return;

        const endDate = new Date(endDateStr).getTime();
        const diff = endDate - now;

        if (diff <= 0) {
            el.textContent = config.closingText;
            el.classList.add(config.endingClass);
            return;
        }

        // Add ending class when under 10 minutes
        if (diff < 10 * 60 * 1000) {
            el.classList.add(config.endingClass);
        }

        el.textContent = `${formatCountdown(diff)} remaining`;
    });
}

// Admin results page countdowns
function initAdminResultsCountdown(): void {
    const config: CountdownConfig = {
        selector: ".result-countdown",
        endingClass: "countdown-ending",
        closingText: "Closing...",
    };

    if (document.querySelector(config.selector)) {
        updateCountdowns(config);
        setInterval(() => updateCountdowns(config), 1000);
    }
}

// Voter elections list countdowns
function initElectionsListCountdown(): void {
    const config: CountdownConfig = {
        selector: ".election-countdown",
        endingClass: "ending",
        closingText: "Closing soon...",
    };

    if (document.querySelector(config.selector)) {
        updateCountdowns(config);
        setInterval(() => updateCountdowns(config), 1000);
    }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    initAdminResultsCountdown();
    initElectionsListCountdown();
});
