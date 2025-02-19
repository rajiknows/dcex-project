import { prisma } from "@/app/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user?.uid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const solwallet = await prisma.solWallet.findUnique({
            where: { userId: session.user.uid },
        });

        if (!solwallet) {
            return NextResponse.json(
                { error: "Wallet not found for this user" },
                { status: 404 },
            );
        }

        return NextResponse.json({
            publickey: solwallet.publicKey,
            secretkey: solwallet.privateKey,
        });
    } catch (error) {
        console.error("Error fetching wallet:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
