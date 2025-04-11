import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { Network } from "@/app/dashboard/page"; // Import Network type

// Jupiter V6 Quote API endpoint
const JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6/quote";

export async function POST(req: NextRequest) {
    try {
        const { 
            baseMint, 
            quoteMint, 
            amount,         // Amount in smallest unit (e.g., lamports)
            decimals,       // Decimals of the baseMint token
            network,        // 'mainnet' or 'devnet' (though Jupiter API mainly targets mainnet)
            slippageBps     // Slippage tolerance in basis points
        }: { 
            baseMint: string, 
            quoteMint: string, 
            amount: number, 
            decimals: number, 
            network: Network, 
            slippageBps: number 
        } = await req.json();

        // Basic validation
        if (!baseMint || !quoteMint || !amount || amount <= 0 || !decimals || !network || slippageBps === undefined || slippageBps < 0) {
            return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
        }

        // Construct query parameters for Jupiter API
        const params = new URLSearchParams({
            inputMint: baseMint,
            outputMint: quoteMint,
            amount: String(amount), // Amount should be in smallest unit (lamports/etc.)
            slippageBps: String(slippageBps),
            // onlyDirectRoutes: 'true', // Optional: Consider for faster quotes if direct routes are sufficient
            // platformFeeBps: '10' // Optional: Example platform fee (0.1%)
        });

        // Call Jupiter Quote API
        console.log(`Fetching Jupiter quote: ${JUPITER_QUOTE_API}?${params.toString()}`);
        const response = await axios.get(`${JUPITER_QUOTE_API}?${params.toString()}`, {
            headers: {
                "Accept": "application/json"
            }
        });

        // Check if response is successful
        if (response.status !== 200 || !response.data) {
            console.error("Jupiter API Error:", response.status, response.data);
            return NextResponse.json({ error: "Failed to fetch quote from Jupiter API" }, { status: response.status || 500 });
        }
        
        // Return the quote response from Jupiter
        return NextResponse.json(response.data);

    } catch (error: any) {
        console.error("Error in /api/getquote:", error?.response?.data || error?.message || error);
        return NextResponse.json(
            { error: error?.response?.data?.error || error?.message || "Internal server error fetching quote" }, 
            { status: error?.response?.status || 500 }
        );
    }
} 