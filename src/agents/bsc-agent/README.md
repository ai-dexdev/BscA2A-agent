# BSC Agent

The **BSC Agent** is a Genkit-powered AI Agent that interacts with the Binance Smart Chain (BSC) to perform on-chain actions such as token creation, transfers, and wallet interactions using tools like `viem`, `Moralis`, and the BSC RPC.

---

### 1. Initialize (Encrypt Private Key)

Before running the agent, run the init script to encrypt your BSC private key:

```bash
npm run bsc:init
```

This will launch a CLI that securely encrypts your private key and gives you an encrypted value, which you’ll need to set as `BSC_WALLET_PRIVATE_KEY` in your environment.

---

### 2. Set environment variables

```bash
# API Keys
export GEMINI_API_KEY="your-gemini-api-key"
export GOOGLE_API_KEY="your-google-api-key"
export MORALIS_API_KEY="your-moralis-api-key"

# BSC Config
export BSC_RPC_URL="https://bsc-dataseed.binance.org"
export BSC_WALLET_PRIVATE_KEY="your-encrypted-private-key"
export BSC_WALLET_ADDRESS="0x..."
```

---

### 3. Run the agent

Once the environment is set up:

```bash
npm run agents:bsc-agent
```

The agent will start on `http://localhost:41241`.

---
