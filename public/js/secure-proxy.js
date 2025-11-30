/**
 * Secury Action Proxy - DOM Sandboxing Layer
 * Perevents LLM from accessing credentials while allowing authenticated actions
 */

class SecureActionProxy {
    constructor(sessionId) {
        this.sessionId = sessionId;
        Object.freeze(this); // Make the instance immutable
    }

    async executeAction(actionName, actionParams) {
        try {
            const response = await fetch('/api/execute-action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    actionName,
                    actionParams
                }),
            });

            if (!response.ok) {
                throw new Error(`Action execution failed: ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error executing action:', error);
            throw error;
        }
    }
}

/**
 * Secure Session Manager
 * Encapsulates session management in a closure to prevent credential leakage
 */
(function() {
    let secureProxy = null;
    let sessionActive = false;

    /**
     * Initialize a secure session with credentials
     * Credentials are immediately sent to server and never stored in DOM
     */

    window.initSecureSession = async (credentials) => {
        try {
            const responses = await fetch('/api/create-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ credentials }),
            });
            if (!responses.ok) {
                throw new Error(`Session creation failed: ${responses.statusText}`);
            }
            const { sessionId } = await responses.json();
            secureProxy = new SecureActionProxy(sessionId);
            sessionActive = true;

            // Only expose the execute method to global scope
            // sessionID remains hidden in closure
            window.chatbotAPI = {
                execute: (action, params) => {
                    if (!sessionActive) {
                        throw new Error('Secure session is not active.');
                    }
                    return secureProxy.executeAction(action, params);
                }, 

                isActive: () => sessionActive,

                endSession: async () => {
                    if (sessionActive) {
                        await fetch('/api/end-session', {
                            method: 'POST',
                            credentials: 'include',
                        });
                        sessionActive = false;
                        secureProxy = null;
                    }
                }
            };
            console.log('Secure session initialized successfully.');
        } catch (error) {
            console.error('Error initializing secure session:', error);
            throw error;
        }
    };

    /**
     * Auto-cleanup on page unload
     */

    window.addEventListener('beforeunload', async () => {
        if (window.chatbotAPI && window.chatbotAPI.isActive()) {
            await window.chatbotAPI.endSession();
        }
    });


})();