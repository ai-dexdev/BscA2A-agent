# BSC Agent

The **BSC Agent** is a Genkit-powered **A2A** AI Agent that interacts with the Binance Smart Chain (BSC) to perform on-chain actions such as token creation, transfers, and wallet interactions using tools like `viem` and the BSC RPC.

---

### 1. Install Dependencies

Make sure you have [`pnpm`](https://pnpm.io/) installed. Then install all project dependencies:

```bash
pnpm install
```

---

### 2. Initialize (Encrypt Private Key)

Before running the agent, run the init script to encrypt your BSC private key:

```bash
npm run bsc:init
```

This will launch a CLI that securely encrypts your private key and gives you an encrypted value, which you’ll need to set as `BSC_WALLET_PRIVATE_KEY` in your environment.

---

### 3. Set Environment Variables

```bash
# API Keys
export GEMINI_API_KEY="your-gemini-api-key"
export GOOGLE_API_KEY="your-google-api-key"

# BSC Config
export BSC_RPC_URL="https://bsc-dataseed.binance.org"
export BSC_WALLET_PRIVATE_KEY="your-encrypted-private-key"
export BSC_WALLET_ADDRESS="0x..."
```

You can also add these to a `.env` file if your project is configured to load it.

---

### 4. Run the Agent

Once the environment is set up:

```bash
npm run agents:bsc-agent
```

The agent will start on:  
`http://localhost:41241`

---

### 5. Run the A2A CLI

To interact with the BSC Agent through a CLI interface:

```bash
npm run a2a:cli
```

This command starts a CLI that lets you perform various actions using the Agent-to-Agent (A2A) protocol.
