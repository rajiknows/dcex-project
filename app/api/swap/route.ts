import { NextRequest, NextResponse } from "next/server";
import { mainnetConnection, devnetConnection } from "@/lib/constants";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import axios from "axios";
import { auth } from "@/lib/auth";
import { prisma } from "@/app/db";
import { Network } from "@/app/dashboard/page";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { quoteResponse, network = "mainnet" }: { quoteResponse: any, network?: Network } = await req.json();

    if (!quoteResponse) {
      return NextResponse.json(
        { error: "Missing quoteResponse field" },
        { status: 400 }
      );
    }

    const solWallet = await prisma.solWallet.findUnique({
      where: { userId: session.user.id },
    });
    if (!solWallet) {
      return NextResponse.json(
        { error: "Wallet not found for this user" },
        { status: 404 }
      );
    }

    const isDevnet = network === 'devnet';
    const publicKey = isDevnet ? solWallet.publicKey : solWallet.publicKey;
    const secretKeyString = isDevnet ? solWallet.privateKey : solWallet.privateKey;
    const connection = isDevnet ? devnetConnection : mainnetConnection;

    if (!publicKey || !secretKeyString) {
      return NextResponse.json(
        { error: `Keys not found for ${network}` },
        { status: 404 }
      );
    }

    const parsedQuoteResponse =
      typeof quoteResponse === "string"
        ? JSON.parse(quoteResponse)
        : quoteResponse;

    const swapApiUrl = isDevnet
      ? "https://quote-api.jup.ag/v6/swap"
      : "https://quote-api.jup.ag/v6/swap";

    const { data } = await axios.post(
      swapApiUrl,
      {
        quoteResponse: parsedQuoteResponse,
        userPublicKey: publicKey,
        wrapAndUnwrapSol: true,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!data.swapTransaction) {
      return NextResponse.json(
        { error: "swapTransaction is undefined in Jupiter response" },
        { status: 500 }
      );
    }

    const swapTransactionBuf = Buffer.from(data.swapTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    const secretKeyArray = new Uint8Array(secretKeyString.split(",").map(Number));
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
    }, "confirmed");

    const explorerUrl = isDevnet
      ? `https://explorer.solana.com/tx/${txid}?cluster=devnet`
      : `https://solscan.io/tx/${txid}`;

    return NextResponse.json({
      success: true,
      txid,
      explorerUrl: explorerUrl,
    });
  } catch (error: any) {
    console.error("Swap API Error:", error?.response?.data || error?.message || error);
    return NextResponse.json(
      { error: error?.response?.data?.message || error?.message || "Internal Server Error during swap" },
      { status: error?.response?.status || 500 }
    );
  }
}

