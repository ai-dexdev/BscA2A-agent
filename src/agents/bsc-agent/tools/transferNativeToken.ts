//@ts-nocheck
import { ai, z } from "../genkit.js";
import { parseEther } from "viem";
import { walletClient } from "../config.js";
import { privateKeyToAccount } from "viem/accounts";
import { buildTxUrl, checkTransactionHash } from "../util.js";

export const sendBNB = ai.defineTool(
    {
        name: "sendBNB",
        description: "Transfer native token (BNB). Before execution, ensure the wallet information is verified.",
        inputSchema: z.object({
            recipientAddress: z.string().describe("The recipient's wallet address."),
            amount: z.string().describe("The amount of BNB to send (as a string, e.g., '0.1').")
        })
    },
    async ({ recipientAddress, amount }) => {
        let txHash: `0x${string}` | undefined;

        try {
            const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`);

            txHash = await walletClient(account).sendTransaction({
                to: recipientAddress as `0x${string}`,
                value: parseEther(amount)
            });

            const txUrl = await checkTransactionHash(txHash);

            return {
                content: [
                    {
                        type: "text",
                        text: `Transaction sent successfully.\n\n [View on Explorer](${txUrl})`,
                        url: txUrl
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const txUrl = buildTxUrl(txHash);

            return {
                content: [
                    {
                        type: "text",
                        text: `Transaction failed: ${errorMessage}`,
                        url: txUrl
                    }
                ],
                isError: true
            };
        }
    }
);
