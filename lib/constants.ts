import { Connection, clusterApiUrl } from "@solana/web3.js";
import axios from "axios";
import { SUPPORTED_TOKENS } from "./tokens";
import { Decimal } from "@prisma/client/runtime/library";
import { Network } from "@/app/dashboard/page";

let LAST_UPDATED: number | null = null;
let prices: {
    [key: string]: {
        price: string;
    };
} = {};

export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export type QuoteResponse = {
    inputMint: string;
    inAmount: string;
    outputMint: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: "ExactIn" | "ExactOut";
    slippageBps: number;
    platformFee: null | string;
    priceImpactPct: string;
    routePlan: {
        swapInfo: {
            ammKey: string;
            label: string;
            inputMint: string;
            outputMint: string;
            inAmount: string;
            outAmount: string;
            feeAmount: string;
            feeMint: string;
        };
        percent: number;
    }[];
    contextSlot: number;
    timeTaken: number;
};

const TOKEN_PRICE_REFRESH_INTERVAL = 60 * 1000; // every 60s

export const connection = new Connection(
    "https://solana-mainnet.g.alchemy.com/v2/EspGgEsKtp6xdG1-P32lj9raEFUlgXNc",
);

export const mainnetConnection = new Connection(
    process.env.MAINNET_RPC_URL || "https://api.mainnet-beta.solana.com",
    "confirmed",
);

export const devnetConnection = new Connection(clusterApiUrl("devnet"), "confirmed");

export async function getLivePrice(
    baseMint: string,
    quoteMint: string,
    amount: number,
    decimals: number,
    network: Network,
    slippageBps: number
): Promise<QuoteResponse> {
    try {
        const response = await axios.post(`${BACKEND_URL}/getquote`, {
            baseMint,
            quoteMint,
            amount,
            decimals,
            network,
            slippageBps,
        });
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch price on ${network} with slippage ${slippageBps}:`, error);
        throw new Error(`Failed to fetch price quote for ${network}`);
    }
}

export async function getSupportedTokens() {
    if (
        !LAST_UPDATED ||
        new Date().getTime() - LAST_UPDATED > TOKEN_PRICE_REFRESH_INTERVAL
    ) {
        try {
            const response = await axios.get(
                "https://api.jup.ag/price/v2?ids=SOL,USDC,USDT",
            );
            prices = response.data.data || {};
            LAST_UPDATED = new Date().getTime();
        } catch (e) {
            console.log("Error fetching token prices:", e);
            prices = {};
        }
    }

    return SUPPORTED_TOKENS.map((s) => ({
        ...s,
        price: prices[s.name]?.price || s.price, // Fallback to predefined price if API data is missing
    }));
}

getSupportedTokens();
