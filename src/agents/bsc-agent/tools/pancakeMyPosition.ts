import { ai, z } from "../genkit.js";
import { myPosition } from "../functions/pancakeSwapPosition.js";
import { bigIntReplacer } from "../util.js";
import { getAccount } from "../config.js";

export const viewPancakeSwapPositions = ai.defineTool(
    {
        name: "viewPancakeSwapPositions",
        description: "View your active liquidity positions on PancakeSwap",
        inputSchema: z.object({}) // No inputs required
    },
    async () => {
        try {
            const account = await getAccount();
            const positions = await myPosition(account.address);

            return {
                content: [
                    {
                        type: "text",
                        text: `Active PancakeSwap positions:\n\n${JSON.stringify(positions, bigIntReplacer, 2)}`
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to fetch positions: ${errorMessage}`
                    }
                ],
                isError: true
            };
        }
    }
);
