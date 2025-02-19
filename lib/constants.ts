import { Connection } from "@solana/web3.js";
import axios from "axios";
import { SUPPORTED_TOKENS } from "./tokens";
import { QuoteHTMLAttributes } from "react";

let LAST_UPDATED: number | null = null;
let prices: {
  [key: string]: {
    price: string;
  };
} = {};

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

export async function getLivePrice(
  baseMint: string,
  quoteMint: string,
  amount: number,
  decimals: number,
): Promise<QuoteResponse> {
  try {
    const response = await axios.get(
      `https://api.jup.ag/swap/v1/quote?inputMint=${baseMint}&outputMint=${quoteMint}&amount=${amount * 10 ** decimals
      }&slippageBps=50&restrictIntermediateTokens=true`,
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch price:", error);
    throw error;
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

export async function swap(quoteResponse) {
  try {
    // Fetch user's public and secret keys
    const { data: keys } = await axios.get("/api/getKeys");
    // console.log(keys);

    if (!keys.publickey || !keys.secretkey) {
      throw new Error("Missing public or secret key.");
    }

    const userPublicKey = keys.publicKey;
    const secretKey = Uint8Array.from(
      keys.secretkey.split(",").map(Number),
    ); // Convert to Uint8Array

    const jsonquoteResponse = JSON.parse(quoteResponse);

    console.log({ jsonquoteResponse });

    // Send swap request
    const { data: swapResponse } = await axios.post("/api/swap", {
      quoteResponse: jsonquoteResponse,
      publickey: userPublicKey,
      secretKey: Array.from(secretKey), // Send secretKey as an array
    });

    console.log("Swap Transaction Successful:", swapResponse);
    return swapResponse;
  } catch (error) {
    console.error("Swap failed:", error);
    throw error;
  }
}

getSupportedTokens();
