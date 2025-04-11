import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
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
                // After successful sign in via Google, fetch or create user and get the id
                try {
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                email: user.email,
                                name: user.name,
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                            }),
                        },
                    );

                    if (response.ok) {
                        const data = await response.json();
                        token.uid = data.user.id; // Get the user ID from the backend response
                    } else {
                        console.error(
                            "Failed to register/login user on backend:",
                            response.status,
                        );
                        // Optionally handle the error, e.g., by setting token.error = true
                    }
                } catch (error) {
                    console.error("Error communicating with backend:", error);
                    // Optionally handle the error
                }
            }
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
            return session;
        },
        async signIn({
            user,
            account,
        }: {
            user: NextAuthUser;
            account: Account | null;
        }) {
            if (
                !user.email ||
                !account?.providerAccountId ||
                account.provider !== "google"
            ) {
                return false; // Only allow Google sign-in to trigger backend registration here
            }
            return true; // Let the jwt callback handle the backend interaction
        },
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
