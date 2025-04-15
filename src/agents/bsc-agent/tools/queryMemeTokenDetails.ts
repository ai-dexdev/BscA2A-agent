import { ai, z } from "../genkit.js";
import { memeTokenDetail } from "../functions/memeTokenDetails.js";

export const queryMemeTokenDetails = ai.defineTool(
    {
        name: "queryMemeTokenDetails",
        description: "Fetches token details for a given meme token using the four.meme API. Default price in USDT.",
        inputSchema: z.object({
            tokenName: z.string().describe("The name of the token to query (e.g., HGBNB)")
        })
    },
    async ({ tokenName }) => {
        try {
            const data = await memeTokenDetail(tokenName);

            return {
                content: [
                    {
                        type: "text",
                        text: `Token details for "${tokenName}":\n\n${JSON.stringify(data, null, 2)}`
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to fetch token details: ${errorMessage}`
                    }
                ],
                isError: true
            };
        }
    }
);
