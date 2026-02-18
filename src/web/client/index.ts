import zxcvbn from 'zxcvbn';

export function initPasswordStrength(): void {
    const passwordInput = document.getElementById('password') as HTMLInputElement | null;
    const nameInput = document.getElementById('name') as HTMLInputElement | null;
    const emailInput = document.getElementById('email') as HTMLInputElement | null;
    const strengthContainer = document.getElementById('passwordStrength') as HTMLElement | null;
    const strengthBar = document.getElementById('strengthBar') as HTMLElement | null;
    const strengthText = document.getElementById('strengthText') as HTMLElement | null;
    const feedbackDiv = document.getElementById('passwordFeedback') as HTMLElement | null;
    const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement | null;
    
    if (!passwordInput || !nameInput || !emailInput || !strengthContainer || 
        !strengthBar || !strengthText || !feedbackDiv || !submitBtn) {
        return; // Not on registration page or missing elements
    }
    
    const requirements = {
        length: document.getElementById('req-length') as HTMLElement | null,
        strength: document.getElementById('req-strength') as HTMLElement | null,
        noPersonal: document.getElementById('req-no-personal') as HTMLElement | null
    };
    
    function updateRequirement(element: HTMLElement | null, met: boolean): void {
        if (!element) return;
        const checkbox = element.querySelector('.checkbox');
        if (!checkbox) return;
        
        if (met) {
            element.classList.add('met');
            checkbox.textContent = '☑';
        } else {
            element.classList.remove('met');
            checkbox.textContent = '☐';
        }
    }
    
    function checkPassword(): void {
        const password = passwordInput!.value;
        
        if (!password) {
            strengthContainer!.style.display = 'none';
            return;
        }
        
        strengthContainer!.style.display = 'block';
        
        // Get user inputs to prevent using them in password
        const userInputs: string[] = [];
        if (nameInput!.value) userInputs.push(nameInput!.value);
        if (emailInput!.value) userInputs.push(emailInput!.value);
        
        // Check with zxcvbn
        const result = zxcvbn(password, userInputs);
        
        // Update strength bar
        const strengthPercent = (result.score / 4) * 100;
        strengthBar!.style.width = strengthPercent + '%';
        
        // Set strength bar color and text
        const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const strengthColors = ['#dc2626', '#f59e0b', '#fbbf24', '#10b981', '#059669'];
        
        strengthBar!.style.backgroundColor = strengthColors[result.score];
        strengthText!.textContent = strengthLabels[result.score];
        strengthText!.style.color = strengthColors[result.score];
        
        // Check requirements
        updateRequirement(requirements.length, password.length >= 8);
        updateRequirement(requirements.strength, result.score >= 3);
        
        // Check if password contains personal info
        let containsPersonal = false;
        if (nameInput!.value && password.toLowerCase().includes(nameInput!.value.toLowerCase().split(' ')[0])) {
            containsPersonal = true;
        }
        if (emailInput!.value && password.toLowerCase().includes(emailInput!.value.split('@')[0].toLowerCase())) {
            containsPersonal = true;
        }
        updateRequirement(requirements.noPersonal, !containsPersonal);
        
        // Show feedback
        if (result.feedback.warning || result.feedback.suggestions.length > 0) {
            let feedback = '';
            if (result.feedback.warning) {
                feedback += '<strong>⚠️ ' + result.feedback.warning + '</strong><br>';
            }
            if (result.feedback.suggestions.length > 0) {
                feedback += result.feedback.suggestions.join(' ');
            }
            feedbackDiv!.innerHTML = feedback;
            feedbackDiv!.style.display = 'block';
        } else {
            feedbackDiv!.style.display = 'none';
        }
        
        // Enable/disable submit button
        const allRequirementsMet = password.length >= 8 && result.score >= 3 && !containsPersonal;
        submitBtn!.disabled = !allRequirementsMet;
        
        if (!allRequirementsMet) {
            submitBtn!.style.opacity = '0.5';
            submitBtn!.style.cursor = 'not-allowed';
        } else {
            submitBtn!.style.opacity = '1';
            submitBtn!.style.cursor = 'pointer';
        }
    }
    
    passwordInput.addEventListener('input', checkPassword);
    nameInput.addEventListener('input', checkPassword);
    emailInput.addEventListener('input', checkPassword);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPasswordStrength);
} else {
    initPasswordStrength();
}
