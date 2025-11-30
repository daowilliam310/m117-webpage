/**
 * Secure Credential Input Web Component
 * Uses closed Shadow DOM to hide credentials from main document
 */

class SecureCredentialInput extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'closed' }); // Closed Shadow DOM

        this.sessionInitialized = false;
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            :host {
            display: block;
            margin: 20px 0;
            }
            
            .credential-container {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 12px;
            padding: 20px;
            max-width: 500px;
            }
            
            .credential-container.success {
            background: #d1f4e0;
            border-color: #10b981;
            }
            
            h3 {
            margin: 0 0 15px 0;
            color: #1e3a8a;
            font-size: 1.1rem;
            }
            
            .form-group {
            margin-bottom: 15px;
            }
            
            label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #374151;
            font-size: 0.9rem;
            }
            
            input {
            width: 100%;
            padding: 10px 12px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.95rem;
            box-sizing: border-box;
            }
            
            input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            button {
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            font-size: 0.95rem;
            }
            
            button:hover {
            background: linear-gradient(135deg, #1e40af, #2563eb);
            }
            
            button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            }
            
            .success-message {
            color: #065f46;
            font-weight: 600;
            margin-top: 10px;
            }
            
            .error-message {
            color: #dc2626;
            font-size: 0.85rem;
            margin-top: 5px;
            }
        </style>
        
        <div class="credential-container" id="container">
            <h3>🔒 Secure Credential Setup</h3>
            <form id="credForm">
            <div class="form-group">
                <label for="apiKey">API Key</label>
                <input 
                type="password" 
                id="apiKey" 
                placeholder="Enter your API key"
                autocomplete="off"
                required
                >
                <div id="apiKeyError" class="error-message" style="display: none;"></div>
            </div>
            
            <div class="form-group">
                <label for="apiSecret">API Secret</label>
                <input 
                type="password" 
                id="apiSecret" 
                placeholder="Enter your API secret"
                autocomplete="off"
                required
                >
                <div id="apiSecretError" class="error-message" style="display: none;"></div>
            </div>
            
            <button type="submit" id="submitBtn">
                Initialize Secure Session
            </button>
            <div id="successMsg" class="success-message" style="display: none;"></div>
            </form>
        </div>
        `;
    }

    attachEventListeners() {
        const form = this.shadowRoot.getElementById('credForm');
        const submitBtn = this.shadowRoot.getElementById('submitBtn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (this.sessionInitialized) return;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Initializing...';

            const apiKey = this.shadowRoot.getElementById('apiKey').value;
            const apiSecret = this.shadowRoot.getElementById('apiSecret').value;

            try {
                // Send credentials to server for session initialization immediately
                await window.initSecureSession({ apiKey, apiSecret, timestamp: Date.now() });

                // Clear inputs immedately after sending
                this.shadowRoot.getElementById('apiKey').value = '';
                this.shadowRoot.getElementById('apiSecret').value = '';

                // Show success state
                this.sessionInitialized = true;
                const container = this.shadowRoot.getElementById('container');
                const successMsg = this.shadowRoot.getElementById('successMsg');

                container.classList.add('success');
                successMsg.textContent = '✅ Secure session initialized successfully!';
                successMsg.style.display = 'block';
                submitBtn.textContent = 'Session Active';

                // Dispatch event to notify parent (without credentials)
                this.dispatchEvent(new CustomEvent('credentials-set', {
                    bubbles: true,
                    composed: true,
                    detail: { success: true }
                    
                }));


                // Hide form after 2 seconds
                setTimeout(() => {
                    form.style.display = 'none';
                    successMsg.style.fontSize = '1.1rem';
                }, 2000);
            } catch (error) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Initialize Secure Session';

                const errorDiv = this.shadowRoot.getElementById('apiKeyError');
                errorDiv.textContent = 'Failed to initialize secure session. Please try again.';
                errorDiv.style.display = 'block';
            }
        });
    }
}

customElements