// Password strength checker for registration form
import { createIcons, Circle, CheckCircle } from 'lucide';

function initPasswordStrength() {
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const strengthContainer = document.getElementById('passwordStrength');
    const requirementsContainer = document.getElementById('passwordRequirements');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
    
    if (!passwordInput || !strengthContainer) return;
    
    const reqLength = document.getElementById('req-length');
    const reqStrength = document.getElementById('req-strength');
    const reqNoPersonal = document.getElementById('req-no-personal');
    
    function checkStrength(password: string) {
        const name = nameInput ? nameInput.value.toLowerCase() : '';
        const email = emailInput ? emailInput.value.toLowerCase().split('@')[0] : '';
        const pwd = password.toLowerCase();
        
        const checks = {
            length: password.length >= 8,
            noPersonal: !name || !email || (!pwd.includes(name) && !pwd.includes(email)),
            strength: 0
        };
        
        // Simple strength scoring
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;
        
        checks.strength = score;
        
        return checks;
    }
    
    function updateIcon(el: HTMLElement | null, met: boolean) {
        if (!el) return;
        const icon = el.querySelector('i, svg');
        if (icon) {
            icon.setAttribute('data-lucide', met ? 'check-circle' : 'circle');
            createIcons({ icons: { Circle, CheckCircle } });
        }
    }
    
    function updateUI(password: string) {
        if (!password) {
            if (strengthContainer) strengthContainer.hidden = true;
            if (requirementsContainer) requirementsContainer.hidden = true;
            
            // Reset strength bar and text
            if (strengthBar) strengthBar.className = 'strength-fill';
            if (strengthText) {
                strengthText.className = 'strength-label';
                strengthText.textContent = '';
            }
            
            // Reset requirement icons
            if (reqLength) {
                reqLength.classList.remove('met');
                updateIcon(reqLength, false);
            }
            if (reqStrength) {
                reqStrength.classList.remove('met');
                updateIcon(reqStrength, false);
            }
            if (reqNoPersonal) {
                reqNoPersonal.classList.remove('met');
                updateIcon(reqNoPersonal, false);
            }
            
            // Disable submit button
            if (submitBtn) submitBtn.disabled = true;
            
            return;
        }
        
        if (strengthContainer) strengthContainer.hidden = false;
        if (requirementsContainer) requirementsContainer.hidden = false;
        
        const checks = checkStrength(password);
        
        // Update requirements
        if (reqLength) {
            reqLength.classList.toggle('met', checks.length);
            updateIcon(reqLength, checks.length);
        }
        if (reqStrength) {
            reqStrength.classList.toggle('met', checks.strength >= 3);
            updateIcon(reqStrength, checks.strength >= 3);
        }
        if (reqNoPersonal) {
            reqNoPersonal.classList.toggle('met', checks.noPersonal);
            updateIcon(reqNoPersonal, checks.noPersonal);
        }
        
        // Update strength bar
        const levels = ['weak', 'weak', 'fair', 'good', 'strong', 'strong'];
        const labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Strong'];
        const level = levels[checks.strength] || 'weak';
        const label = labels[checks.strength] || 'Weak';
        
        if (strengthBar) {
            strengthBar.className = 'strength-fill ' + level;
        }
        if (strengthText) {
            strengthText.className = 'strength-label ' + level;
            strengthText.textContent = label;
        }
        
        // Enable/disable submit
        const isValid = checks.length && checks.noPersonal && checks.strength >= 2;
        if (submitBtn) {
            submitBtn.disabled = !isValid;
        }
    }
    
    passwordInput.addEventListener('input', function() {
        updateUI(this.value);
    });
    
    if (nameInput) {
        nameInput.addEventListener('input', function() {
            if (passwordInput.value) updateUI(passwordInput.value);
        });
    }
    
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            if (passwordInput.value) updateUI(passwordInput.value);
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPasswordStrength);
} else {
    initPasswordStrength();
}
