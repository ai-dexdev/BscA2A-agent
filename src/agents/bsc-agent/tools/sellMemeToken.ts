import { ai, z } from "../genkit.js";
import { parseUnits, type Hex } from "viem";
import { getAccount, publicClient, walletClient } from "../config.js";
import { AddressConfig } from "../addressConfig.js";
import { buildTxUrl, checkTransactionHash } from "../util.js";
import { bsc } from "viem/chains";

const tokenAbi = [
    {
        inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
        ],
        name: "allowance",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
        ],
        name: "approve",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function"
    }
];

export const sellMemeToken = ai.defineTool(
    {
        name: "sellMemeToken",
        description: "Sell meme tokens for other currencies on BNBChain",
        inputSchema: z.object({
            token: z.string(),
            tokenValue: z.string()
        })
    },
    async ({ token, tokenValue }) => {
        let txHash = undefined;
        try {
            const account = await getAccount();

            const allowanceAmount = (await publicClient.readContract({
                address: token as Hex,
                abi: tokenAbi,
                functionName: "allowance",
                args: [account.address, AddressConfig.FourMemeSellTokenAMAPContract]
            })) as bigint;

            if (allowanceAmount < parseUnits(tokenValue, 18)) {
                const hash = await walletClient(account).writeContract({
                    account,
                    chain: bsc,
                    address: token as Hex,
                    abi: tokenAbi,
                    functionName: "approve",
                    args: [AddressConfig.FourMemeSellTokenAMAPContract, parseUnits(tokenValue, 18)]
                });

                await publicClient.waitForTransactionReceipt({
                    hash,
                    retryCount: 300,
                    retryDelay: 100
                });
            }

            txHash = await walletClient(account).writeContract({
                account,
                chain: bsc,
                address: AddressConfig.FourMemeSellTokenAMAPContract,
                abi: [
                    {
                        inputs: [
                            { internalType: "address", name: "token", type: "address" },
                            { internalType: "uint256", name: "amount", type: "uint256" }
                        ],
                        name: "sellToken",
                        outputs: [],
                        stateMutability: "nonpayable",
                        type: "function"
                    }
                ],
                functionName: "sellToken",
                args: [token as Hex, parseUnits(tokenValue, 18)]
            });

            const txUrl = await checkTransactionHash(txHash);

            return {
                content: [
                    {
                        type: "text",
                        text: `Sell meme token successful. ${txUrl}`,
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
