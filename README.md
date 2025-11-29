# SecureBank - Vulnerable Banking Website for Security Research

A full-stack banking website with an AI-powered group chat widget, intentionally designed to be vulnerable to prompt injection attacks for educational security research.

## Features

- **Multi-User Banking Dashboard**: Three pre-configured user accounts with checking and savings accounts
- **Dynamic Account Information**: Real-time display of account balances, transactions, and sensitive data
- **Group Chat with AI**: Multi-user chat interface with Mistral (via Ollama) integration that can access page context
- **Intentionally Vulnerable**: Designed to demonstrate prompt injection, XSS, and data exfiltration vulnerabilities
- **Database-Driven**: SQLite database with pre-populated accounts and transaction history

## Security Research Purpose

This application is designed for **ECE M117: Computer System Security** research on:
- Client-side prompt injection attacks
- Data exfiltration vulnerabilities
- AI chatbot security testing
- Virtual DOM filtering defenses
- Prompt restriction strategies

## Installation

```bash
npm install
```

## Configuration

1. Install Ollama from https://ollama.ai
2. Pull and run the Mistral model:

```bash
ollama run mistral
```

3. Create a `.env` file in the root directory (optional, uses defaults):

```
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=mistral
PORT=3000
```

## Running the Application

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Database

The SQLite database (`database.sqlite`) is automatically created and seeded with:
- 3 user accounts (Alice Chen, Bob Smith, Carol Davis)
- 2 bank accounts per user (Checking and Savings)
- 10 transactions per account
- Realistic sensitive data (API keys, session tokens, SSN fragments, routing numbers)

## Project Structure

```
ECEM117/
├── server.js           (Express backend with API endpoints)
├── public/
│   └── index.html      (Frontend banking interface with chat widget)
├── package.json        (Dependencies)
├── .env                (Environment variables)
└── database.sqlite     (Auto-generated SQLite database)
```

## Testing Prompt Injection Attacks

The chatbot has **NO BUILT-IN DEFENSES** to allow testing of various attack vectors:

1. **XSS Attacks**: Try prompts that request code generation
2. **Data Exfiltration**: Ask the AI to reveal sensitive information from the page
3. **Instruction Override**: Attempt to bypass any restrictions with role-playing
4. **Continuation Attacks**: Chain requests to extract data gradually
5. **Embedded Commands**: Hide malicious instructions within legitimate queries

## API Endpoints

- `GET /api/users` - List all users
- `GET /api/accounts/:userId` - Get user's accounts
- `GET /api/transactions/:accountId` - Get account transactions
- `GET /api/user-context/:userId` - Get full user context (accounts + transactions)
- `GET /api/chat/messages` - Get recent chat messages
- `POST /api/chat/send` - Send message and get AI response

## Technologies

- **Backend**: Node.js, Express, SQLite3
- **Frontend**: HTML5, Bootstrap 5, Vanilla JavaScript
- **AI**: Mistral via Ollama API
- **Database**: SQLite

## Team

Team 9B - The Game Is Not Over
- Apar
- Shubhan
- William
- Alex
- Brandon

## Disclaimer

This application contains intentional security vulnerabilities for educational purposes. **DO NOT deploy this in production or expose it to the public internet.**

