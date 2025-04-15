//@ts-nocheck
import { ai, z } from "../genkit.js";
import { parseUnits, getContract, Address, publicActions } from "viem";
import { bep20abi } from "../lib/bep20Abi.js";
import { walletClient } from "../config.js";
import { privateKeyToAccount } from "viem/accounts";
import { buildTxUrl, checkTransactionHash } from "../util.js";

export const sendBEP20Token = ai.defineTool(
    {
        name: "sendBEP20Token",
        description: "Send any BEP-20 token to another wallet (requires wallet check first)",
        inputSchema: z.object({
            recipientAddress: z.string().describe("The recipient wallet address."),
            amount: z.string().describe("The amount of tokens to send."),
            address: z.string().describe("The BEP-20 token contract address.")
        })
    },
    async ({ recipientAddress, amount, address }) => {
        let txHash: `0x${string}` | undefined;

        try {
            const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`);
            const client = walletClient(account).extend(publicActions);

            const contract = getContract({
                address: address as Address,
                abi: bep20abi,
                client
            });

            const decimals = await contract.read.decimals();
            const parsedAmount = parseUnits(amount, decimals);

            txHash = await contract.write.transfer([`0x${recipientAddress.replace("0x", "")}`, parsedAmount], {
                gas: BigInt(100_000)
            });

            const txUrl = await checkTransactionHash(txHash);

            return {
                content: [
                    {
                        type: "text",
                        text: `BEP-20 token transfer sent successfully.\n\n [View on Explorer](${txUrl})`,
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
