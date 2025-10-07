// Authentication JavaScript for DocuChain
class AuthManager {
    constructor() {
        this.initializeEventListeners();
        this.loadSavedData();
    }

    initializeEventListeners() {
        // Form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Password toggle
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Wallet connect
        const walletBtn = document.getElementById('walletBtn');
        if (walletBtn) {
            walletBtn.addEventListener('click', () => this.handleWalletConnect());
        }

        // Remember me checkbox
        const rememberCheckbox = document.getElementById('remember');
        if (rememberCheckbox) {
            rememberCheckbox.addEventListener('change', (e) => this.handleRememberMe(e));
        }
    }

    loadSavedData() {
        // Load saved email if remember me was checked
        const savedEmail = localStorage.getItem('docuchain_email');
        const rememberMe = localStorage.getItem('docuchain_remember') === 'true';
        
        if (savedEmail && rememberMe) {
            const emailInput = document.getElementById('email');
            const rememberCheckbox = document.getElementById('remember');
            
            if (emailInput) emailInput.value = savedEmail;
            if (rememberCheckbox) rememberCheckbox.checked = true;
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const rememberCheckbox = document.getElementById('remember');

        if (!emailInput || !passwordInput) return;

        const formData = {
            email: emailInput.value.trim(),
            password: passwordInput.value,
            remember: rememberCheckbox ? rememberCheckbox.checked : false
        };

        // Validate form
        if (!this.validateForm(formData)) {
            return;
        }

        // Show loading state
        this.setLoading(true);
        this.clearError();

        try {
            // Simulate API call (replace with actual API when backend is ready)
            await this.simulateLogin(formData);
            
            // Save credentials if remember me is checked
            if (formData.remember) {
                localStorage.setItem('docuchain_email', formData.email);
                localStorage.setItem('docuchain_remember', 'true');
            } else {
                localStorage.removeItem('docuchain_email');
                localStorage.removeItem('docuchain_remember');
            }

            // Save auth token (temporary simulation)
            localStorage.setItem('docuchain_token', 'temp_token_' + Date.now());
            localStorage.setItem('docuchain_user', JSON.stringify({
                email: formData.email,
                name: 'User',
                role: 'student'
            }));

            // Redirect to dashboard
            this.showSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message || 'Login failed. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    async simulateLogin(formData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Demo credentials (replace with actual authentication)
        const validCredentials = [
            { email: 'admin@docuchain.com', password: 'admin123' },
            { email: 'student@docuchain.com', password: 'student123' },
            { email: 'teacher@docuchain.com', password: 'teacher123' }
        ];

        const isValid = validCredentials.some(cred => 
            cred.email === formData.email && cred.password === formData.password
        );

        if (!isValid) {
            throw new Error('Invalid email or password');
        }

        return { success: true };
    }

    validateForm({ email, password }) {
        if (!email) {
            this.showError('Email is required');
            document.getElementById('email')?.focus();
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            document.getElementById('email')?.focus();
            return false;
        }

        if (!password) {
            this.showError('Password is required');
            document.getElementById('password')?.focus();
            return false;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            document.getElementById('password')?.focus();
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.getElementById('togglePassword');
        const icon = toggleBtn?.querySelector('i');

        if (!passwordInput || !icon) return;

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.className = 'ri-eye-off-line';
        } else {
            passwordInput.type = 'password';
            icon.className = 'ri-eye-line';
        }
    }

    async handleWalletConnect() {
        if (!window.ethereum) {
            this.showError('No wallet detected. Install MetaMask or another compatible wallet.');
            return;
        }

        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (accounts.length > 0) {
                const address = accounts[0];
                console.log('Connected wallet:', address);
                
                // Save wallet connection
                localStorage.setItem('docuchain_wallet', address);
                localStorage.setItem('docuchain_token', 'wallet_token_' + Date.now());
                localStorage.setItem('docuchain_user', JSON.stringify({
                    wallet: address,
                    name: 'Wallet User',
                    role: 'student'
                }));

                this.showSuccess('Wallet connected successfully! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            this.showError('Wallet connection failed. Please try again.');
        }
    }

    handleRememberMe(event) {
        const isChecked = event.target.checked;
        if (!isChecked) {
            localStorage.removeItem('docuchain_email');
            localStorage.removeItem('docuchain_remember');
        }
    }

    setLoading(isLoading) {
        const submitBtn = document.getElementById('submitBtn');
        if (!submitBtn) return;

        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Signing in...';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="ri-door-open-line"></i> Sign In';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.style.display = 'flex';
            errorDiv.classList.add('show');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.clearError();
            }, 5000);
        }
    }

    showSuccess(message) {
        // Create or update success message
        let successDiv = document.getElementById('success-message');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'success-message';
            successDiv.className = 'success show';
            successDiv.innerHTML = '<i class="ri-check-line"></i> <span id="success-text"></span>';
            
            // Insert after error message or at the top of form
            const errorDiv = document.getElementById('error-message');
            const form = document.getElementById('loginForm');
            if (errorDiv && form) {
                form.insertBefore(successDiv, errorDiv.nextSibling);
            }
        }

        const successText = document.getElementById('success-text');
        if (successText) {
            successText.textContent = message;
            successDiv.style.display = 'flex';
            successDiv.classList.add('show');
        }
    }

    clearError() {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.classList.remove('show');
        }
    }
}

// Initialize authentication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});

// Check if user is already logged in
function checkAuthStatus() {
    const token = localStorage.getItem('docuchain_token');
    const user = localStorage.getItem('docuchain_user');
    
    if (token && user) {
        // User is already logged in, redirect to dashboard
        window.location.href = 'dashboard.html';
    }
}

// Run auth check on page load
checkAuthStatus();