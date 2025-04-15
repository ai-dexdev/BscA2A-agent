import { ai, z } from "../genkit.js";
// @ts-ignore
import { GoPlus, ErrorCode } from "@goplus/sdk-node";

export const checkTokenSecurity = ai.defineTool(
    {
        name: "checkTokenSecurity",
        description: "Analyze BNBChain tokens for potential security risks powered by GoPlus",
        inputSchema: z.object({
            tokenAddress: z.string().describe("Token address on BNBChain to check for security risks")
        })
    },
    async ({ tokenAddress }) => {
        try {
            const chainId = "56"; // BSC
            const addresses = [tokenAddress];

            const res = await (GoPlus as any).tokenSecurity(chainId, addresses, 30);

            if (res.code !== (ErrorCode as any).SUCCESS) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Security check failed: ${res.message}`
                        }
                    ],
                    isError: true
                };
            }

            const securityData = res.result[tokenAddress] || {};

            return {
                content: [
                    {
                        type: "text",
                        text: `Security check successful for ${tokenAddress} result ${res.result}`,
                        SecurityCheckResult: res.result
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                content: [
                    {
                        type: "text",
                        text: `Security check failed: ${errorMessage}`
                    }
                ],
                isError: true
            };
        }
    }
);
