import { ai, z } from "../genkit.js";
import { pancakeSwap } from "../functions/pancakeSwapTool.js";
import { getAccount } from "../config.js";
import { buildTxUrl, checkTransactionHash } from "../util.js";
import { Hex } from "viem";

export const pancakeSwapTokenExchange = ai.defineTool(
    {
        name: "pancakeSwapTokenExchange",
        description: "Exchange tokens on BNBChain using PancakeSwap DEX",
        inputSchema: z.object({
            inputToken: z.string().describe("The address of the input token (e.g. BUSD)"),
            outputToken: z.string().describe("The address of the output token (e.g. WBNB)"),
            amount: z.string().describe("Amount of input token to swap (in human readable format)")
        })
    },
    async ({ inputToken, outputToken, amount }) => {
        let txHash: string | undefined;
        try {
            const account = await getAccount();
            txHash = await pancakeSwap({
                account,
                inputToken,
                outputToken,
                amount
            });

            const txUrl = await checkTransactionHash(txHash as Hex);

            return {
                content: [
                    {
                        type: "text",
                        text: `PancakeSwap transaction sent successfully.\n\n ${txUrl}`,
                        url: txUrl
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const txUrl = buildTxUrl(txHash as Hex);
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
