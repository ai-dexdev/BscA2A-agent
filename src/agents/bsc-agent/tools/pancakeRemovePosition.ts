import { ai, z } from "../genkit.js";
import { removeLiquidityV3 } from "../functions/pancakeRemoveLiquidityTool.js";
import { getAccount } from "../config.js";
import { buildTxUrl, checkTransactionHash } from "../util.js";
import { Hex } from "viem";

export const removePancakeSwapLiquidity = ai.defineTool(
    {
        name: "removePancakeSwapLiquidity",
        description: "Withdraw your liquidity from PancakeSwap V3 pools",
        inputSchema: z.object({
            positionId: z.string().describe("Position ID to withdraw liquidity from"),
            percent: z.number().min(1).max(100).describe("Percentage of liquidity to withdraw (1-100)")
        })
    },
    async ({ positionId, percent }) => {
        let txHash: string | undefined;
        try {
            const account = await getAccount();
            txHash = await removeLiquidityV3(account, BigInt(positionId), percent);

            const txUrl = await checkTransactionHash(txHash as Hex);

            return {
                content: [
                    {
                        type: "text",
                        text: `Successfully removed liquidity from PancakeSwap.\n\n ${txUrl}`,
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
