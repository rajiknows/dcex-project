import { NextRequest, NextResponse } from "next/server";
import { connection } from "@/lib/constants";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import axios from "axios";
import { auth } from "@/lib/auth";
import { prisma } from "@/app/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { quoteResponse } = await req.json();

    if (!quoteResponse) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          quoteResponse: quoteResponse,
        },
        { status: 400 }
      );
    }

    const solWallet = await prisma.solWallet.findUnique({
      where: { userId: session.user?.uid },
    });
    if (!solWallet) {
      return NextResponse.json(
        { error: "Wallet not found for this user" },
        { status: 404 }
      );
    }

    const publicKey = solWallet.publicKey;
    const secretKey = solWallet.privateKey;

    const parsedQuoteResponse =
      typeof quoteResponse === "string"
        ? JSON.parse(quoteResponse)
        : quoteResponse;

    const { data } = await axios.post(
      "https://api.jup.ag/swap/v1/swap",
      {
        quoteResponse: parsedQuoteResponse,
        userPublicKey: publicKey,
        wrapAndUnwrapSol: true,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!data.swapTransaction) {
      return NextResponse.json(
        { error: "swapTransaction is undefined" },
        { status: 500 }
      );
    }

    const swapTransactionBuf = Buffer.from(data.swapTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    const secretKeyArray = new Uint8Array(secretKey.split(",").map(Number));
    const keypair = Keypair.fromSecretKey(secretKeyArray);

    transaction.sign([keypair]);

    const latestBlockHash = await connection.getLatestBlockhash();
    const rawTransaction = transaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2,
    });

    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: txid,
    });

    return NextResponse.json({
      success: true,
      txid,
      solscan: `https://solscan.io/tx/${txid}`,
    });
  } catch (error: any) {
    console.error("Error:", error?.response?.data || error?.message);
    return NextResponse.json(
      { error: error?.response?.data || "Internal Server Error" },
      { status: 500 }
    );
  }
}

