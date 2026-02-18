export function initVotingFeatures(): void {
    initBlurToggle();
}

// SVG paths for eye icons (avoids lucide re-render issues)
const EYE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>';

/**
 * Toggle blur on confirmation IDs
 */
function initBlurToggle(): void {
    document.querySelectorAll('.toggle-blur-btn').forEach(btn => {
        btn.addEventListener('click', function(this: HTMLElement) {
            const container = this.closest('.confirmation-id-container');
            if (!container) return;
            
            const codeEl = container.querySelector('.confirmation-id') as HTMLElement | null;
            if (!codeEl) return;
            
            const fullId = codeEl.dataset.fullId || '';
            
            if (codeEl.classList.contains('blurred')) {
                codeEl.textContent = fullId;
                codeEl.classList.remove('blurred');
                this.innerHTML = EYE_OFF_ICON;
                this.title = 'Hide full ID';
            } else {
                codeEl.textContent = '••••••••-••••-••••-••••-' + fullId.slice(-12);
                codeEl.classList.add('blurred');
                this.innerHTML = EYE_ICON;
                this.title = 'Show full ID';
            }
        });
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVotingFeatures);
} else {
    initVotingFeatures();
}
