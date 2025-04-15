import { ai, z } from "../genkit.js";
import { parseUnits } from "viem";
import { addLiquidityV3 } from "../functions/pancakeAddLiquidityTool.js";
import { CurrencyAmount } from "@pancakeswap/sdk";
import { FeeAmount } from "@pancakeswap/v3-sdk";
import { getToken } from "../functions/pancakeSwapTool.js";
import { getAccount } from "../config.js";
import { buildTxUrl, checkTransactionHash } from "../util.js";

export const addPancakeSwapLiquidity = ai.defineTool(
    {
        name: "addPancakeSwapLiquidity",
        description: "💧 Provide liquidity to PancakeSwap trading pairs",
        inputSchema: z.object({
            token0: z.string().describe("First token symbol (e.g., USDT)"),
            token1: z.string().describe("Second token symbol (e.g., BNB)"),
            token0Amount: z.string().describe("Amount of token0 to add"),
            token1Amount: z.string().describe("Amount of token1 to add")
        })
    },
    async ({ token0, token1, token0Amount, token1Amount }) => {
        let txHash = undefined;

        try {
            const tokenA = await getToken(token0);
            const tokenB = await getToken(token1);

            const amountTokenA = CurrencyAmount.fromRawAmount(
                tokenA,
                parseUnits(token0Amount, tokenA.decimals).toString()
            );
            const amountTokenB = CurrencyAmount.fromRawAmount(
                tokenB,
                parseUnits(token1Amount, tokenB.decimals).toString()
            );

            const account = await getAccount();

            txHash = await addLiquidityV3(
                tokenA,
                tokenB,
                FeeAmount.MEDIUM, // 0.3%
                amountTokenA,
                amountTokenB,
                account
            );

            const txUrl = await checkTransactionHash(txHash);

            return {
                content: [
                    {
                        type: "text",
                        text: `Added liquidity to PancakeSwap successfully. ${txUrl}`,
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
                        text: `Failed to add liquidity: ${errorMessage}`,
                        url: txUrl
                    }
                ],
                isError: true
            };
        }
    }
);
