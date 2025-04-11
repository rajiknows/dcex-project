import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

const SOL_AIRDROP_AMOUNT = 2 * LAMPORTS_PER_SOL; 


export async function airdropDevnetSol(
    userDevnetPublicKey: string,
    connection: Connection,
) {
    try {
        const userPubkey = new PublicKey(userDevnetPublicKey);

        // 1. Airdrop SOL
        console.log(`Airdropping ${SOL_AIRDROP_AMOUNT / LAMPORTS_PER_SOL} SOL to ${userDevnetPublicKey}...`);
        const solSignature = await connection.requestAirdrop(
            userPubkey,
            SOL_AIRDROP_AMOUNT,
        );
        await connection.confirmTransaction(solSignature, "confirmed");
        console.log("SOL Airdrop successful:", solSignature);


    } catch (error) {
        console.error("Devnet SOL airdrop failed:", error);
        throw error;
    }
}

