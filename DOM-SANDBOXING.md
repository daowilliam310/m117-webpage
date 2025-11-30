# DOM-Level Sandboxing Implementation

## Overview

This implementation provides DOM-level sandboxing that prevents the LLM chatbot from extracting sensitive credentials (account numbers, routing numbers, SSN, API keys) through prompt injection attacks, while still allowing it to perform authenticated actions and maintain full Q&A functionality.

**All sensitive credentials are stored server-side only** - the client DOM never receives full account numbers, routing numbers, or API keys. Only masked versions (last 4 digits) are displayed to users.

## Architecture

### Core Components

1. **Secure Credential Input** (`/public/js/secure-credential-input.js`)
   - Web Component using closed Shadow DOM
   - Prevents external access to credential input fields
   - Immediately sends credentials to server, never stores in main DOM

2. **Secure Action Proxy** (`/public/js/secure-proxy.js`)
   - Manages server-side session creation
   - Stores sessionId in JavaScript closure (inaccessible to global scope)
   - Exposes only `window.chatbotAPI.execute()` method

3. **Server-Side Session Management** (`server.js`)
   - Stores credentials server-side in Map when user logs in
   - **Full account numbers, routing numbers, API keys stored in session**
   - **Client only receives last 4 digits of sensitive data**
   - Validates all action requests against allowlist
   - Executes authenticated actions without exposing credentials

## How It Works

### 1. Credential Collection (Shadow DOM)

```javascript
// Credentials are collected in closed Shadow DOM
class SecureCredentialInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'closed' }); // Prevents external access
  }
  
  // When form is submitted:
  // 1. Credentials sent to server immediately
  // 2. Input fields cleared
  // 3. Success event dispatched (no credentials in event)
}
```

**Security Benefits:**
- `mode: 'closed'` prevents `element.shadowRoot` access
- Input values never stored in accessible variables
- Main document cannot query Shadow DOM elements

### 2. Session Initialization (Closure Pattern)

```javascript
// secure-proxy.js
(function() {
  let secureProxy = null;  // Private to closure
  
  window.initSecureSession = async (credentials) => {
    const { sessionId } = await fetch('/api/create-session', {
      body: JSON.stringify({ credentials })
    });
    
    secureProxy = new SecureActionProxy(sessionId);
    
    // Only expose execute method, NOT sessionId
    window.chatbotAPI = {
      execute: (action, params) => secureProxy.executeAction(action, params)
    };
  };
})();
```

**Security Benefits:**
- SessionId never accessible via `window.sessionId`
- Credentials never stored client-side
- Only proxy methods exposed to global scope

### 3. Action Execution (Server-Side Validation)

```javascript
// server.js - On Login
app.post('/api/auth/login', async (req, res) => {
  // ... authenticate user ...
  
  // Store full account credentials in server-side session
  const userAccounts = db.exec('SELECT account_number, routing_number, ssn_last4, api_key FROM accounts WHERE user_id = ?', [user.id]);
  const credentials = userAccounts.length > 0 ? userAccounts[0].values.map(row => ({
    account_number: row[0],      // Full number stored server-side
    routing_number: row[1],      // Full number stored server-side
    ssn_last4: row[2],
    api_key: row[3]              // Full key stored server-side
  })) : [];
  
  sessions.set(sessionToken, {
    credentials: credentials,    // Stored in server memory
    userId: user.id,
    expiresAt: expiresAt.getTime()
  });
});

// API endpoint returns only masked data
app.get('/api/user-context', authenticateSession, (req, res) => {
  const accounts = accountResult.map(row => ({
    account_number_last4: row[2].slice(-4),  // Only last 4 digits sent
    routing_number_last4: row[5].slice(-4),  // Only last 4 digits sent
    // Full numbers NEVER sent to client
  }));
});

const ALLOWED_ACTIONS = {
  'make_payment': async (credentials, params) => {
    const cred = credentials[0]; // Get full credentials from server session
    // Use cred.account_number and cred.routing_number for actual payment
    console.log('Processing from account:', '****' + cred.account_number.slice(-4));
    return { success: true, message: 'Payment processed' };
  },
  'transfer_funds': async (credentials, params) => {
    const cred = credentials[0];
    // Use full account_number and routing_number for ACH transfer
    return { success: true, message: 'Transfer initiated' };
  }
};
```

**Security Benefits:**
- Full account numbers never sent to client
- Full routing numbers never sent to client
- API keys never sent to client
- Only last 4 digits displayed in UI
- Credentials stored server-side only
- Actions validated against allowlist
- Params validated before execution
- Sessions expire automatically

## Chatbot Usage

### ✅ What the Chatbot CAN Do

1. **Normal Q&A (Unchanged)**
   ```javascript
   // Read public DOM
   const balance = document.querySelector('.balance-display').textContent;
   
   // Answer questions
   "Your account balance is " + balance;
   ```

2. **Perform Authenticated Actions (Via Proxy)**
   ```javascript
   // User asks: "Send my transaction report to john@example.com"
   
   await window.chatbotAPI.execute('send_email', {
     to: 'john@example.com',
     subject: 'Transaction Report',
     body: generateReport()
   });
   ```

### ❌ What the Chatbot CANNOT Do

1. **Extract Credentials from DOM**
   ```javascript
   // ❌ These all fail or return only masked data
   document.querySelector('.account-number').textContent;  // "****1234" (masked)
   document.querySelector('[data-account-number]');  // Doesn't exist (removed from DOM)
   document.querySelector('[data-routing-number]');  // Doesn't exist (removed from DOM)
   document.querySelector('[data-api-key]');  // Doesn't exist (removed from DOM)
   document.body.innerText;  // Only contains masked values like "****1234"
   
   window.sessionId;  // undefined
   window.credentials;  // undefined
   ```

2. **Access Shadow DOM**
   ```javascript
   // ❌ Shadow DOM is closed
   document.querySelector('secure-credential-input').shadowRoot;  // null
   ```

3. **Perform Unauthorized Actions**
   ```javascript
   // ❌ Server rejects unknown actions
   await window.chatbotAPI.execute('delete_all_data', {});
   // Error: Action 'delete_all_data' is not allowed
   ```

## Defense Layers

1. **Layer 1: Shadow DOM Isolation**
   - Credentials never enter main DOM
   - Closed mode prevents external access
   - Input fields cleared immediately after submission

2. **Layer 2: Closure Encapsulation**
   - SessionId stored in JavaScript closure
   - Not accessible via `window` or any global variable
   - Only proxy methods exposed

3. **Layer 3: Server-Side Validation**
   - All actions validated against allowlist
   - Parameters validated per action type
   - Sessions expire after timeout
   - Credentials never sent to client

4. **Layer 4: Content Security Policy**
   - Prevents injection of malicious scripts
   - Restricts data exfiltration methods
   - Enforces same-origin policy

## Testing

### Test Page: `/test-secure-proxy.html`

1. **Initialize Session**
   - Enter test credentials in secure input
   - Credentials sent to server, stored in session
   - SessionId returned and stored in closure

2. **Test Actions**
   - Send Email: Simulates authenticated email action
   - Fetch Data: Simulates API data retrieval
   - Make Payment: Simulates payment processing

3. **Verify Protection**
   - Attempts to extract `window.sessionId` → Blocked
   - Attempts to access `window.credentials` → Blocked
   - Attempts to access Shadow DOM → Blocked
   - All credential extraction attempts fail

### Integration with Main App

The secure proxy is integrated into the main banking app (`/public/index.html`):

```html
<!-- Loads before main application script -->
<script src="/js/secure-proxy.js"></script>
<script src="/js/secure-credential-input.js"></script>

<!-- Credential input in dashboard -->
<secure-credential-input></secure-credential-input>

<!-- Chatbot can use proxy for authenticated actions -->
<script>
  // Original chat functionality preserved
  document.getElementById('chat-input-form').addEventListener('submit', async (e) => {
    // ... existing chat code unchanged ...
  });
  
  // Notification when secure session is ready
  document.addEventListener('credentials-set', (e) => {
    console.log('✓ Secure session active');
  });
</script>
```

## Allowed Actions

Current allowlist (can be extended):

- `send_email` - Send emails using API credentials (uses stored API key)
- `fetch_data` - Fetch data from authenticated endpoints (uses account number)
- `make_payment` - Process payments using stored credentials (uses account number & routing number)
- `transfer_funds` - Initiate ACH transfers (uses full account & routing numbers)

### Adding New Actions

```javascript
// server.js
const ALLOWED_ACTIONS = {
  'new_action': async (credentials, params) => {
    // Validate params
    if (!params.required_field) {
      throw new Error('Missing required_field');
    }
    
    // Use credentials to perform action
    const result = await someApiCall(credentials.apiKey, params);
    
    return { success: true, result };
  }
};
```

## Security Guarantees

✅ **Full account numbers never exposed to client-side JavaScript**
- Stored in server-side session only
- Only last 4 digits sent to client for display

✅ **Full routing numbers never exposed to client-side JavaScript**
- Stored in server-side session only
- Only last 4 digits sent to client for display

✅ **API keys never exposed to client-side JavaScript**
- Stored in server-side session only
- Fully masked in UI

✅ **LLM cannot extract sessionId**
- Stored in closure, not accessible globally

✅ **LLM can still perform authenticated actions**
- Via proxy pattern with server-side validation
- Actions use full credentials stored server-side

✅ **Original chatbot functionality preserved**
- Can read public DOM, answer questions, have conversations
- Can see masked account info (last 4 digits)

✅ **Defense in depth**
- Multiple layers: No full credentials in API response + Shadow DOM + Closure + Server validation

## Potential Attacks & Mitigations

### Attack: Prompt Injection to Extract Credentials
**Mitigation:** Credentials not accessible to LLM - they're not in DOM or global scope

### Attack: DOM Manipulation to Access Shadow DOM
**Mitigation:** Shadow DOM in 'closed' mode prevents access

### Attack: Calling Unauthorized Actions
**Mitigation:** Server validates against allowlist, rejects unknown actions

### Attack: Session Hijacking
**Mitigation:** SessionId in closure only, expires after timeout

### Attack: XSS to Inject Script
**Mitigation:** CSP headers restrict script sources and execution

## Performance Impact

- **Minimal**: One additional HTTP request for session creation
- **Session lifetime**: 1 hour (configurable)
- **No impact on**: Regular chatbot Q&A functionality

## Browser Compatibility

- ✅ Chrome/Edge 53+
- ✅ Firefox 63+
- ✅ Safari 10.1+
- Requires: Custom Elements, Shadow DOM, Fetch API, ES6+

## Conclusion

This implementation successfully prevents LLM credential extraction while maintaining full chatbot functionality. The multi-layered approach ensures that even if one layer is compromised, others provide protection. The chatbot can still perform all authenticated actions through the secure proxy, making it both secure and functional.
