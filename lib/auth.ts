import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthConfig, Session, User as NextAuthUser } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/app/db";
import { Keypair } from "@solana/web3.js";

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
    adapter: PrismaAdapter(prisma),
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
            // Ensure email and name are always requested
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                };
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    events: {
        async createUser(message: { user: NextAuthUser }) {
            const user = message.user;

            // Check if user ID exists
            if (!user.id) {
                console.error("User ID is missing in createUser event");
                return; // Exit if no user ID
            }

            // Generate mainnet keypair
            const mainnetKeypair = Keypair.generate();
            const mainnetPublicKey = mainnetKeypair.publicKey.toString();
            const mainnetPrivateKey = Array.from(mainnetKeypair.secretKey).join(',');

            // Generate devnet keypair
            const devnetKeypair = Keypair.generate();
            const devnetPublicKey = devnetKeypair.publicKey.toString();
            const devnetPrivateKey = Array.from(devnetKeypair.secretKey).join(',');

            // Create SolWallet entry
            await prisma.solWallet.create({
                data: {
                    userId: user.id,
                    publicKey: mainnetPublicKey,
                    privateKey: mainnetPrivateKey,
                    devnetPublicKey: devnetPublicKey,
                    devnetPrivateKey: devnetPrivateKey,
                },
            });

            // Create default INR wallet (if applicable, adjust as needed)
            await prisma.inrWallet.create({
                data: {
                    userId: user.id,
                    balance: 0, // Initial balance
                },
            });

             // TODO: Add Devnet Airdrop Logic here
             // You'll need the devnetPublicKey and a connection to the devnet cluster
             console.log(`Devnet Airdrop needed for user ${user.id}, pubkey: ${devnetPublicKey}`);
             // Example: await airdropDevnetSol(devnetPublicKey, 1); // 1 SOL
             // Example: await airdropDevnetSplToken(usdcMintAddress, devnetPublicKey, 100); // 100 USDC
        },
    },
    callbacks: {
        async jwt({ token, user }) {
            // The adapter handles linking user and account. User object passed on sign-in.
            if (user?.id) {
                token.uid = user.id;
            } else if (token.sub) {
                 // For subsequent requests, use token.sub (which should be the user ID)
                 // The adapter ensures the user exists, so fetching again might be redundant unless needed
                 // token.uid = token.sub; // Directly use sub if it's guaranteed to be user ID
                 // Fetch user only if necessary or for verification
                 const dbUser = await prisma.user.findUnique({
                     where: { id: token.sub },
                 });
                 if (dbUser) {
                     token.uid = dbUser.id;
                 }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.uid) {
                const customUser: CustomSession['user'] = {
                    email: session.user.email ?? '',
                    name: session.user.name ?? '',
                    image: session.user.image ?? '',
                    uid: token.uid as string,
                };
                return {
                    ...session,
                    user: customUser,
                } as CustomSession;
            }
            return session;
        },
         // signIn callback is usually handled by the adapter, keep minimal
         // async signIn({ user, account }) {
         //    // Custom logic before sign-in completes (e.g., check allowlist)
         //    // return true; // Allow sign-in
         // }
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Removed the explicit fetch call as PrismaAdapter handles DB interaction
