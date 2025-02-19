import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma as db } from "@/app/db";
import { Keypair } from "@solana/web3.js";
import type { NextAuthConfig, Session } from "next-auth";
import type { Account } from "next-auth";
import type { User as NextAuthUser } from "next-auth";

// Define your custom session type
interface CustomSession extends Session {
  user: {
    email: string;
    name: string;
    image: string;
    uid: string;
  };
  expires: string;
}

export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
      authorization: {
        params: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        const dbUser = await db.user.findFirst({
          where: {
            username: user.email ?? "",
          },
        });

        if (dbUser) {
          token.uid = dbUser.id;
        }
      }
      // console.log("token", token);
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        return {
          ...session,
          user: {
            ...session.user,
            uid: token.uid as string,
          },
        } as CustomSession;
      }

      console.log("session is ", session);
      return session;
    },
    async signIn({
      user,
      account,
    }: {
      user: NextAuthUser;
      account: Account | null;
    }) {
      if (!user.email) return false;

      try {
        const existingUser = await db.user.findFirst({
          where: { username: user.email },
        });

        if (existingUser) return true;

        const keypair = Keypair.generate();
        await db.user.create({
          data: {
            username: user.email,
            name: user.name || null,
            profilePicture: user.image || null,
            provider: "Google",
            providerAccountId: account?.providerAccountId,
            SolWallet: {
              create: {
                publicKey: keypair.publicKey.toBase58(),
                privateKey: keypair.secretKey.toString(),
              },
            },
            InrWallet: {
              create: { balance: 0 },
            },
          },
        });
        return true;
      } catch (error) {
        console.error("SignIn error:", error);
        return false;
      }
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
