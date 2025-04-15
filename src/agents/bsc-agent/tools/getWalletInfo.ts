import { ai, z } from "../genkit.js";
import { getBalance } from "../functions/fetchBalanceTool.js";
import { getAccount } from "../config.js"; // This should return the account using the private key (like MCP)

export const getWalletInfo = ai.defineTool(
    {
        name: "getWalletInfo",
        description: "View detailed balance and holdings for any wallet address",
        inputSchema: z.object({
            address: z.string().optional().describe("Leave empty to use your own wallet")
        })
    },
    async ({ address }) => {
        try {
            if (address === "" || !address || address === "null") {
                const account = await getAccount(); // Must return object with `.address`
                address = account.address;
            }

            const balance = await getBalance(address);

            const tokenLines = balance.tokenBalances
                .map((token: { symbol: string; balance: string }) => `${token.symbol}: ${token.balance}`)
                .join("\n");

            return {
                content: [
                    {
                        type: "text",
                        text: `Native Balance (BNB): ${balance.nativeBalance}\n\nToken Balances:\n${tokenLines}\n\nWallet Address: ${address}`
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to fetch balance: ${errorMessage}`
                    }
                ],
                isError: true
            };
        }
    }
);
