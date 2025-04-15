import { ai, z } from "../genkit.js";
import { parseUnits, type Hex } from "viem";
import { getAccount, publicClient, walletClient } from "../config.js";
import { AddressConfig } from "../addressConfig.js";
import { bsc } from "viem/chains";

export const buyMemeToken = ai.defineTool(
    {
        name: "buyMemeToken",
        description: "Purchase meme tokens on BNBChain",
        inputSchema: z.object({
            token: z.string().describe("The address of the meme token."),
            tokenValue: z.string().default("0").describe("The amount of tokens you want to buy."),
            bnbValue: z.string().default("0").describe("The amount of BNB you're using to buy.")
        })
    },
    async ({ token, tokenValue, bnbValue }) => {
        try {
            const account = await getAccount();

            const [, , estimatedAmount, , , amountMsgValue] = await publicClient.readContract({
                address: AddressConfig.FourMemeTryBuyContract,
                abi: [
                    {
                        inputs: [
                            { internalType: "address", name: "token", type: "address" },
                            { internalType: "uint256", name: "amount", type: "uint256" },
                            { internalType: "uint256", name: "funds", type: "uint256" }
                        ],
                        name: "tryBuy",
                        outputs: [
                            { internalType: "address", name: "tokenManager", type: "address" },
                            { internalType: "address", name: "quote", type: "address" },
                            { internalType: "uint256", name: "estimatedAmount", type: "uint256" },
                            { internalType: "uint256", name: "estimatedCost", type: "uint256" },
                            { internalType: "uint256", name: "estimatedFee", type: "uint256" },
                            { internalType: "uint256", name: "amountMsgValue", type: "uint256" },
                            { internalType: "uint256", name: "amountApproval", type: "uint256" },
                            { internalType: "uint256", name: "amountFunds", type: "uint256" }
                        ],
                        stateMutability: "view",
                        type: "function"
                    }
                ],
                functionName: "tryBuy",
                args: [token as Hex, parseUnits(tokenValue, 18), parseUnits(bnbValue, 18)]
            });

            let outputAmount: bigint;
            let inputAmount: bigint;

            if (tokenValue === "0") {
                outputAmount = (BigInt(estimatedAmount) * BigInt(80)) / 100n;
                inputAmount = amountMsgValue;
            } else {
                outputAmount = estimatedAmount;
                inputAmount = (BigInt(amountMsgValue) * BigInt(105)) / 100n;
            }

            const hash = await walletClient(account).writeContract({
                account,
                chain: bsc,
                address: AddressConfig.FourMemeBuyTokenAMAPContract,
                abi: [
                    {
                        inputs: [
                            { internalType: "address", name: "token", type: "address" },
                            { internalType: "uint256", name: "funds", type: "uint256" },
                            { internalType: "uint256", name: "minAmount", type: "uint256" }
                        ],
                        name: "buyTokenAMAP",
                        outputs: [],
                        stateMutability: "payable",
                        type: "function"
                    }
                ],
                functionName: "buyTokenAMAP",
                args: [token as Hex, BigInt(inputAmount), outputAmount],
                value: BigInt(inputAmount)
            });

            return {
                content: [
                    {
                        type: "text",
                        text: `Meme token purchase successful!\n\n [View on BscScan](https://bscscan.com/tx/${hash})`,
                        url: `https://bscscan.com/tx/${hash}`
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                content: [
                    {
                        type: "text",
                        text: `Transaction failed: ${errorMessage}`
                    }
                ],
                isError: true
            };
        }
    }
);
