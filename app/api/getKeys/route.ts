import { prisma } from "@/app/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { Network } from "@/app/dashboard/page";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const network = (searchParams.get("network") as Network) || "mainnet";

    try {
        const solwallet = await prisma.solWallet.findUnique({
            where: { userId: session.user.id },
        });

        if (!solwallet) {
            return NextResponse.json(
                { error: "Wallet not found for this user" },
                { status: 404 },
            );
        }

        const isDevnet = network === 'devnet';
        const publicKey = isDevnet ? solwallet.publicKey : solwallet.publicKey;
        const secretKey = isDevnet ? solwallet.privateKey : solwallet.privateKey;
        
        if (!publicKey || !secretKey) {
             return NextResponse.json(
                 { error: `Keys not found for ${network} network` },
                 { status: 404 }
             );
        }

        return NextResponse.json({
            publickey: publicKey,
            secretkey: secretKey,
        });
    } catch (error) {
        console.error("Error fetching wallet keys:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
