/// <reference path="./types.d.ts" />

async function approveVoter(voterId: string): Promise<void> {
    if (!confirm('Approve this voter?')) return;
    
    try {
        const response = await fetch(`/admin/voters/${voterId}/approve`, {
            method: 'POST'
        });
        
        if (response.ok) {
            location.reload();
        } else {
            alert('Failed to approve voter');
        }
    } catch (error) {
        alert('Error approving voter');
    }
}

async function rejectVoter(voterId: string): Promise<void> {
    if (!confirm('Reject this voter?')) return;
    
    try {
        const response = await fetch(`/admin/voters/${voterId}/reject`, {
            method: 'POST'
        });
        
        if (response.ok) {
            location.reload();
        } else {
            alert('Failed to reject voter');
        }
    } catch (error) {
        alert('Error rejecting voter');
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Approve voter buttons
    document.querySelectorAll('[data-action="approve-voter"]').forEach(button => {
        button.addEventListener('click', (e) => {
            const voterId = (e.currentTarget as HTMLElement).dataset.voterId;
            if (voterId) {
                approveVoter(voterId);
            }
        });
    });

    // Reject voter buttons
    document.querySelectorAll('[data-action="reject-voter"]').forEach(button => {
        button.addEventListener('click', (e) => {
            const voterId = (e.currentTarget as HTMLElement).dataset.voterId;
            if (voterId) {
                rejectVoter(voterId);
            }
        });
    });

    // Table filtering
    setupTableFilter('voterFilter', 'votersTable', 'voterCount');
    setupTableFilter('electionFilter', 'electionsTable', 'electionCount');

    // Create Election Modal
    setupCreateElectionModal();
});

// Create Election Modal Setup
function setupCreateElectionModal(): void {
    const modal = document.getElementById('createElectionModal');
    const openBtn = document.getElementById('createElectionBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelModalBtn');
    const startDateInput = document.getElementById('startDate') as HTMLInputElement;
    const endDateInput = document.getElementById('endDate') as HTMLInputElement;

    if (!modal) return;

    // Open modal
    openBtn?.addEventListener('click', () => {
        modal.hidden = false;
        
        // Set minimum date to start of today (allow any time today)
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        if (startDateInput) startDateInput.min = todayStr + 'T00:00';
        if (endDateInput) endDateInput.min = todayStr + 'T00:00';
        
        // Set default start date to now (rounded to next hour)
        const now = new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        const defaultStart = now.toISOString().slice(0, 16);
        if (startDateInput && !startDateInput.value) {
            startDateInput.value = defaultStart;
        }
        
        // Set default end date to 7 days from start
        if (endDateInput && !endDateInput.value) {
            const endDate = new Date(now);
            endDate.setDate(endDate.getDate() + 7);
            endDateInput.value = endDate.toISOString().slice(0, 16);
            endDateInput.min = defaultStart;
        }
        
        // Re-initialize lucide icons in modal
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });

    // Close modal functions
    const closeModal = () => {
        modal.hidden = true;
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) {
            closeModal();
        }
    });

    // Update end date min when start date changes
    startDateInput?.addEventListener('change', () => {
        if (endDateInput && startDateInput.value) {
            endDateInput.min = startDateInput.value;
        }
    });
    
    // Date helper buttons
    setupDateHelpers();
}

function setupDateHelpers(): void {
    document.querySelectorAll<HTMLButtonElement>('.date-helper-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const action = btn.dataset.action;
            if (!targetId || !action) return;
            
            const input = document.getElementById(targetId) as HTMLInputElement;
            if (!input) return;
            
            // Get current value or use now as base
            let date = input.value ? new Date(input.value) : new Date();
            
            switch (action) {
                case 'now':
                    date = new Date();
                    break;
                case '+1h':
                    date.setHours(date.getHours() + 1);
                    break;
                case '-1h':
                    date.setHours(date.getHours() - 1);
                    break;
                case '+1d':
                    date.setDate(date.getDate() + 1);
                    break;
                case '-1d':
                    date.setDate(date.getDate() - 1);
                    break;
                case '+7d':
                    date.setDate(date.getDate() + 7);
                    break;
                case '+30d':
                    date.setDate(date.getDate() + 30);
                    break;
            }
            
            // Format as datetime-local value
            input.value = date.toISOString().slice(0, 16);
            
            // Trigger change event for validation
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });
}

// Table Filter Function
function setupTableFilter(inputId: string, tableId: string, countId: string): void {
    const filterInput = document.getElementById(inputId) as HTMLInputElement;
    const table = document.getElementById(tableId) as HTMLTableElement;
    const countElement = document.getElementById(countId);

    if (!filterInput || !table) return;

    filterInput.addEventListener('input', () => {
        const filterValue = filterInput.value.toLowerCase().trim();
        const rows = table.querySelectorAll('tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const text = row.textContent?.toLowerCase() || '';
            if (text.includes(filterValue)) {
                row.classList.remove('hidden');
                visibleCount++;
            } else {
                row.classList.add('hidden');
            }
        });

        if (countElement) {
            countElement.textContent = visibleCount.toString();
        }
    });
}
