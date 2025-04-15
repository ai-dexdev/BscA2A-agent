import {
    A2AServer,
    TaskContext,
    TaskYieldUpdate,
    schema,
    InMemoryTaskStore // Assuming default store
} from "../../server/index.js";
import { MessageData } from "genkit";
import { ai } from "./genkit.js";
import {
    getWalletInfo,
    sendBEP20Token,
    sendBNB,
    queryMemeTokenDetails,
    pancakeSwapTokenExchange,
    removePancakeSwapLiquidity,
    viewPancakeSwapPositions,
    addPancakeSwapLiquidity,
    checkTokenSecurity,
    createFourMemeToken,
    buyMemeToken,
    sellMemeToken
} from "./tools/index.js";

// Load the prompt defined in movie_agent.prompt
const bscAgentPrompt = ai.prompt("bsc_agent");

const tools = [
    getWalletInfo,
    sendBEP20Token,
    sendBNB,
    queryMemeTokenDetails,
    pancakeSwapTokenExchange,
    removePancakeSwapLiquidity,
    viewPancakeSwapPositions,
    addPancakeSwapLiquidity,
    checkTokenSecurity,
    createFourMemeToken,
    buyMemeToken,
    sellMemeToken
];

/**
 * Task Handler for the Movie Agent.
 */

async function* bscAgentHandler({ task, history }: TaskContext): AsyncGenerator<TaskYieldUpdate> {
    console.log(`[BscAgent] Starting task ${task.id} with state ${task.status.state}`);

    // Initial working state
    yield {
        state: "working",
        message: {
            role: "agent",
            parts: [{ text: "Working on your DeFi request..." }]
        }
    };

    const messages: MessageData[] = (history ?? [])
        .map((m) => ({
            role: (m.role === "agent" ? "model" : "user") as "user" | "model",
            content: m.parts
                .filter((p): p is schema.TextPart => !!(p as schema.TextPart).text)
                .map((p) => ({ text: p.text }))
        }))
        .filter((m) => m.content.length > 0);

    // Handle empty conversation
    if (messages.length === 0) {
        yield {
            state: "input-required",
            message: {
                role: "agent",
                parts: [{ text: "How can I assist you with Binance Smart Chain today?" }]
            }
        };
        return;
    }

    const goal = task.metadata?.goal as string | undefined;
    const lastUserMessage = messages[messages.length - 1].content[0].text.toLowerCase();

    try {
        // Check if this is a follow-up request for another address
        const isAnotherAddressRequest = /another|next|other address/i.test(lastUserMessage);

        if (isAnotherAddressRequest) {
            yield {
                state: "input-required",
                message: {
                    role: "agent",
                    parts: [{ text: "Please provide the next wallet address you'd like me to check." }]
                }
            };
            return;
        }

        // Check if message contains an address directly
        const addressMatch = lastUserMessage.match(/0x[a-fA-F0-9]{40}/);
        if (addressMatch) {
            const address = addressMatch[0];
            const response = await bscAgentPrompt(
                { goal, now: new Date().toISOString() },
                {
                    messages: [
                        ...messages,
                        {
                            role: "user",
                            content: [{ text: `Check balance for ${address}` }]
                        }
                    ],
                    tools: tools
                }
            );

            let responseText = response.text.trim();
            // Clean up any duplicate state markers
            // responseText = responseText.replace(/(COMPLETED\s*)+/gi, "").trim();

            yield {
                state: "completed",
                message: {
                    role: "agent",
                    parts: [{ type: "text", text: responseText }]
                }
            };
            return;
        }

        // Normal prompt handling
        const response = await bscAgentPrompt(
            { goal, now: new Date().toISOString() },
            {
                messages,
                tools: tools
            }
        );

        let responseText = response.text.trim();
        responseText = responseText.replace(/(COMPLETED\s*)+/gi, "").trim();

        // Detect if we need to ask for an address
        const needsAddress = /what is the address|please provide/i.test(responseText);

        yield {
            state: needsAddress ? "input-required" : "completed",
            message: {
                role: "agent",
                parts: [{ type: "text", text: responseText }]
            }
        };
    } catch (err: any) {
        console.error(`Error processing task:`, err);
        yield {
            state: "failed",
            message: {
                role: "agent",
                parts: [
                    {
                        type: "text",
                        text: err.message.includes("Invalid address")
                            ? "Error: The wallet address provided is invalid. Please check and try again."
                            : `Error: ${err.message}`
                    }
                ]
            }
        };
    }
}

// async function* bscAgentHandler({ task, history }: TaskContext): AsyncGenerator<TaskYieldUpdate> {
//     console.log(`[BscAgent] Starting task ${task.id} with state ${task.status.state}`);

//     // Initial working state
//     yield {
//         state: "working",
//         message: {
//             role: "agent",
//             parts: [{ text: "Working on your DeFi request..." }]
//         }
//     };

//     const messages: MessageData[] = (history ?? [])
//         .map((m) => ({
//             role: (m.role === "agent" ? "model" : "user") as "user" | "model",
//             content: m.parts
//                 .filter((p): p is schema.TextPart => !!(p as schema.TextPart).text)
//                 .map((p) => ({ text: p.text }))
//         }))
//         .filter((m) => m.content.length > 0);

//     // Handle empty conversation
//     if (messages.length === 0) {
//         yield {
//             state: "input-required",
//             message: {
//                 role: "agent",
//                 parts: [{ text: "How can I assist you with Binance Smart Chain today?" }]
//             }
//         };
//         return;
//     }

//     const lastUserMessage = messages[messages.length - 1].content[0].text;
//     const isErrorRecovery = history?.some(
//         (m) => m.role === "agent" && m.parts.some((p) => "text" in p && p.text.includes("Error:"))
//     );

//     try {
//         // Handle address validation first
//         const validAddress = lastUserMessage.match(/\b0x[a-fA-F0-9]{40}\b/);
//         if (!validAddress) {
//             yield {
//                 state: "input-required",
//                 message: {
//                     role: "agent",
//                     parts: [
//                         {
//                             text: "The wallet address you provided is invalid. Please provide a complete 42-character address starting with '0x'."
//                         }
//                     ]
//                 }
//             };
//             return;
//         }

//         // Check if this is a follow-up request for another address
//         const isAnotherAddressRequest = /another|next|other (wallet|address)/i.test(lastUserMessage);

//         if (isAnotherAddressRequest) {
//             yield {
//                 state: "input-required",
//                 message: {
//                     role: "agent",
//                     parts: [{ text: "Please provide the next wallet address you'd like me to check." }]
//                 }
//             };
//             return;
//         }

//         // Handle error recovery state
//         if (isErrorRecovery) {
//             yield {
//                 state: "input-required",
//                 message: {
//                     role: "agent",
//                     parts: [{ text: "I'm ready to help. What would you like me to do next?" }]
//                 }
//             };
//             return;
//         }

//         // Normal operation
//         const response = await bscAgentPrompt(
//             { goal: task.metadata?.goal as string | undefined, now: new Date().toISOString() },
//             {
//                 messages,
//                 tools: [
//                     bridgeTokenAgent,
//                     buyMemeTokenAgent,
//                     CreateMemeTokenAgent,
//                     getBalanceAgent,
//                     securityCheckAgent,
//                     pancakeSwapAgent,
//                     sellMemeTokenAgent,
//                     transferBEP20TokenAgent,
//                     transferNativeTokenAgent
//                 ]
//             }
//         );

//         let responseText = response.text.trim();
//         responseText = responseText.replace(/(COMPLETED\s*)+/gi, "").trim();

//         // Detect if we need to ask for an address
//         const needsAddress = /what is the address|please provide/i.test(responseText);

//         yield {
//             state: needsAddress ? "input-required" : "completed",
//             message: {
//                 role: "agent",
//                 parts: [{ type: "text", text: responseText }]
//             }
//         };
//     } catch (err: any) {
//         console.error("Error processing task:", err);

//         // Special handling for invalid address errors
//         if (err.message.includes("Invalid address")) {
//             yield {
//                 state: "input-required",
//                 message: {
//                     role: "agent",
//                     parts: [
//                         {
//                             type: "text",
//                             text: "Error: The wallet address provided is invalid. Please check and provide a complete 42-character address starting with '0x'."
//                         }
//                     ]
//                 }
//             };
//         } else {
//             yield {
//                 state: "failed",
//                 message: {
//                     role: "agent",
//                     parts: [
//                         {
//                             type: "text",
//                             text: `Error: ${err.message}. Please try again or ask for something else.`
//                         }
//                     ]
//                 }
//             };
//         }
//     }
// }

// --- Server Setup ---
const bscAgentCard: schema.AgentCard = {
    name: "BSC DeFi Agent",
    description:
        "An agent for interacting with the Binance Smart Chain. Supports DeFi actions like transferring tokens, swapping, bridging, checking balances, and managing meme tokens.",
    url: "http://localhost:41241",
    provider: {
        organization: "A2A Samples"
    },
    version: "0.0.1",

    capabilities: {
        streaming: false,
        pushNotifications: false,
        stateTransitionHistory: true
    },

    authentication: null,
    defaultInputModes: ["text"],
    defaultOutputModes: ["text"],

    skills: [
        {
            id: "bsc_defi_toolkit",
            name: "BSC DeFi Toolkit",
            description:
                "Perform DeFi operations on Binance Smart Chain, including swaps, transfers, balance checks, token creation, and security analysis.",
            tags: ["defi", "bsc", "tokens", "swap", "bridge", "security", "meme", "crypto"],
            examples: [
                "Transfer 0.5 BNB to 0xABC...123",
                "Swap 100 USDT to BUSD using PancakeSwap",
                "Get wallet info like wallet balance",
                "Create a new meme token called DogeMoon on four.meme",
                "Create a standard BEP-20 token",
                "Buy 500 DOGEMOON tokens from four.meme",
                "Sell 300 DOGEMOON tokens from four.meme",
                "Bridge USDT from BSC to Ethereum",
                "Is this token address safe to interact with? Run a security check",
                "Send 200 CAKE tokens to another wallet",
                "Create a meme token named ShibaBanana with symbol SHIBANA",
                "Launch a new meme token with 0.05 BNB presale"
            ]
        }
    ]
};

// Create server with the task handler. Defaults to InMemoryTaskStore.
const server = new A2AServer(bscAgentHandler, { card: bscAgentCard });

// Start the server
server.start(); // Defaults to port 41241

console.log("[BscAgent] Server started on http://localhost:41241");
console.log("[BscAgent] Press Ctrl+C to stop the server");
