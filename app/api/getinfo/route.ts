import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/app/db/index"; // Adjust if using another DB client

export async function GET() {
  const user = await auth();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // console.log(user.user);
    const userinfo = await prisma.user.findUnique({
      where: { username: user.user?.email || "" }, // Assuming username matches session
      include: { SolWallet: true, InrWallet: true },
    });

    if (!userinfo) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: userinfo.id,
      username: userinfo.username,
      name: userinfo.name,
      profilePicture: userinfo.profilePicture,
      solWallet: userinfo.SolWallet
        ? { publicKey: userinfo.SolWallet.publicKey }
        : null,
      inrBalance: userinfo.InrWallet ? userinfo.InrWallet.balance : 0,
    });
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
