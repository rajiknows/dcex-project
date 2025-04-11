import { NextRequest, NextResponse } from "next/server";
import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { getSupportedTokens } from "@/lib/constants";
import { TokenDetails } from "@/lib/tokens";
import { Network } from "@/app/dashboard/page";

// Define connections 
const mainnetConnection = new Connection(
    process.env.MAINNET_RPC_URL || "https://api.mainnet-beta.solana.com",
    "confirmed",
);
const devnetConnection = new Connection(clusterApiUrl("devnet"), "confirmed");

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const network = (searchParams.get("network") as Network) || "mainnet";

    if (!address) {
         return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    const connection = network === 'devnet' ? devnetConnection : mainnetConnection;
    let userPublicKey: PublicKey;
    try {
         userPublicKey = new PublicKey(address);
    } catch (e) {
         return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
    }

    // Fetch token definitions (assuming getSupportedTokens doesn't need network yet)
    // If getSupportedTokens needs to be network-aware, update it in constants.ts
    const supportedTokens = await getSupportedTokens(); 
    
    const balances = await Promise.all(
        supportedTokens.map((token) => 
            getAccountBalance(
                connection, 
                token, 
                userPublicKey, 
                network 
            )
        ),
    );

    const tokensWithBalances = supportedTokens.map((token, index) => ({
        ...token,
        balance: balances[index]?.toFixed(6) || "0.000000", 
        // TODO: Adjust price fetching if it needs to be network-aware
        usdBalance: (balances[index] * Number(token.price)).toFixed(2), 
    }));

    return NextResponse.json({
        tokens: tokensWithBalances,
        totalBalance: tokensWithBalances
            .reduce((acc, val) => acc + Number(val.usdBalance), 0)
            .toFixed(2),
    });
}

async function getAccountBalance(
    connection: Connection,
    token: TokenDetails,
    userPublicKey: PublicKey,
    network: Network,
): Promise<number> { 
    // Use the correct mint address based on the network
    const mintAddress = network === 'devnet' ? token.devnetMint : token.mint;

    if (!mintAddress) {
        console.warn(`Mint address for ${token.name} on ${network} not found.`);
        return 0;
    }

    // SOL balance check
    if (token.native && mintAddress === "So11111111111111111111111111111111111111112") { 
        try {
            const balance = await connection.getBalance(userPublicKey);
            // console.log(`SOL balance for ${userPublicKey} on ${network}: ${balance / LAMPORTS_PER_SOL}`);
            return balance / LAMPORTS_PER_SOL;
        } catch (error) {
             console.error(`Error fetching SOL balance for ${userPublicKey.toString()} on ${network}:`, error);
             return 0;
        }
    }
    
    // SPL token balance check
    try {
        const mintPublicKey = new PublicKey(mintAddress);
        const ata = await getAssociatedTokenAddress(
            mintPublicKey,
            userPublicKey,
        );
        const account = await getAccount(connection, ata);
        // console.log(`${token.name} balance for ${userPublicKey} on ${network}: ${Number(account.amount) / 10 ** token.decimals}`);
        return Number(account.amount) / 10 ** token.decimals;
    } catch (e: any) {
        if (e.name === 'TokenAccountNotFoundError') {
            return 0; 
        } else {
             console.error(`Error fetching SPL token ${token.name} (${mintAddress}) for ${userPublicKey.toString()} on ${network}:`, e);
            return 0; 
        }
    }
}
