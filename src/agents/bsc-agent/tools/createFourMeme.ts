import { ai, z } from "../genkit.js";
import { parseEther, decodeEventLog, type Hex } from "viem";
import { getAccount, publicClient, walletClient } from "../config.js";
import { AddressConfig } from "../addressConfig.js";
import { bsc } from "viem/chains";

const fourMemeToken = {
    token: "",
    time: 0
};

const loginFourMeme = async (account) => {
    if (Date.now() - fourMemeToken.time < 1000 * 60 * 10) {
        return fourMemeToken.token;
    }

    if (Date.now() - fourMemeToken.time < 1000 * 60 * 15) {
        const resp = await fetch("https://four.meme/meme-api/v1/private/user/info", {
            headers: {
                "meme-web-access": fourMemeToken.token
            },
            method: "GET"
        });
        if (resp.status === 200) {
            const userInfo = await resp.json();
            if (userInfo.msg === "success") {
                fourMemeToken.time = Date.now();
                return fourMemeToken.token;
            }
        }
    }

    const generateResp = await fetch(`https://four.meme/meme-api/v1/private/user/nonce/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            accountAddress: account.address,
            verifyType: "LOGIN",
            networkCode: "BSC"
        })
    });

    const generateJson = await generateResp.json();
    const data = `You are sign in Meme ${generateJson.data}`;
    const signature = await account.signMessage({ message: data });

    const loginResp = await fetch(`https://four.meme/meme-api/v1/private/user/login/dex`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            region: "WEB",
            langType: "EN",
            loginIp: "",
            inviteCode: "",
            verifyInfo: {
                address: account.address,
                networkCode: "BSC",
                signature,
                verifyType: "LOGIN"
            },
            walletName: "MetaMask"
        })
    });

    const loginJson = await loginResp.json();
    fourMemeToken.token = loginJson.data;
    fourMemeToken.time = Date.now();
    return fourMemeToken.token;
};

const createMemeTokenData = async (data, token) => {
    const createResp = await fetch(`https://four.meme/meme-api/v1/private/token/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "meme-web-access": token
        },
        body: JSON.stringify({
            ...data,
            totalSupply: 1000000000,
            raisedAmount: 24,
            saleRate: 0.8,
            reserveRate: 0,
            raisedToken: {
                symbol: "BNB",
                nativeSymbol: "BNB",
                symbolAddress: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
                deployCost: "0",
                buyFee: "0.01",
                sellFee: "0.01",
                minTradeFee: "0",
                b0Amount: "8",
                totalBAmount: "24",
                totalAmount: "1000000000",
                logoUrl: "https://static.four.meme/market/68b871b6-96f7-408c-b8d0-388d804b34275092658264263839640.png",
                tradeLevel: ["0.1", "0.5", "1"],
                status: "PUBLISH",
                buyTokenLink: "https://pancakeswap.finance/swap",
                reservedNumber: 10,
                saleRate: "0.8",
                networkCode: "BSC",
                platform: "MEME"
            },
            launchTime: Date.now(),
            funGroup: false,
            clickFun: false,
            symbol: "BNB",
            label: "Meme",
            lpTradingFee: 0.0025
        })
    });

    const createJson = await createResp.json();
    if (createJson.msg !== "success") {
        throw new Error(`create token data error ${createJson.msg}`);
    }

    const preSaleNum = (parseEther(data.preSale) * BigInt(101)) / BigInt(100);
    return {
        createArg: createJson.data.createArg,
        signature: createJson.data.signature,
        value: preSaleNum
    };
};

export const createFourMemeToken = ai.defineTool(
    {
        name: "createFourMemeToken",
        description: "Launch a new meme token on four.meme platform",
        inputSchema: z.object({
            name: z.string().describe("Token name"),
            shortName: z.string().describe("Short name"),
            imgUrl: z.string().describe("Image URL"),
            preSale: z.string().describe("Presale amount (in BNB)"),
            desc: z.string().describe("Description"),
            twitterUrl: z.string().optional(),
            telegramUrl: z.string().optional(),
            webUrl: z.string().optional()
        })
    },
    async (args) => {
        try {
            const account = await getAccount();

            const payload = {
                ...args,
                ...(args.twitterUrl && { twitterUrl: args.twitterUrl }),
                ...(args.telegramUrl && { telegramUrl: args.telegramUrl }),
                ...(args.webUrl && { webUrl: args.webUrl })
            };

            const loginToken = await loginFourMeme(account);
            const txData = await createMemeTokenData(payload, loginToken);

            const hash = await walletClient(account).writeContract({
                account,
                chain: bsc,
                address: AddressConfig.FourMemeCreateTokenContract,
                abi: [
                    {
                        inputs: [
                            { internalType: "bytes", name: "args", type: "bytes" },
                            { internalType: "bytes", name: "signature", type: "bytes" }
                        ],
                        name: "createToken",
                        outputs: [],
                        stateMutability: "payable",
                        type: "function"
                    }
                ],
                functionName: "createToken",
                args: [txData.createArg as Hex, txData.signature as Hex],
                value: txData.value
            });

            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            if (receipt.status !== "success") throw new Error("Transaction failed");

            const log = receipt.logs.find((log) =>
                // @ts-ignore
                (log.topics || []).includes("0x396d5e902b675b032348d3d2e9517ee8f0c4a926603fbc075d3d282ff00cad20")
            );
            if (!log) throw new Error("Token creation event not found");

            const decoded = decodeEventLog({
                abi: [
                    {
                        anonymous: false,
                        inputs: [
                            { name: "creator", type: "address", indexed: false },
                            { name: "token", type: "address", indexed: false },
                            { name: "requestId", type: "uint256", indexed: false },
                            { name: "name", type: "string", indexed: false },
                            { name: "symbol", type: "string", indexed: false },
                            { name: "totalSupply", type: "uint256", indexed: false },
                            { name: "launchTime", type: "uint256", indexed: false },
                            { name: "launchFee", type: "uint256", indexed: false }
                        ],
                        name: "TokenCreate",
                        type: "event"
                    }
                ],
                data: log.data,
                // @ts-ignore
                topics: log.topics
            });

            return {
                content: [
                    {
                        type: "text", // @ts-ignore
                        text: `Token created successfully!\n https://four.meme/token/${decoded.args.token}`, // @ts-ignore
                        url: `https://four.meme/token/${decoded.args.token}`
                    }
                ]
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
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
