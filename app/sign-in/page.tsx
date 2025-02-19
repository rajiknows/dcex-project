"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/dashboard"); // Redirect after login
        }
    }, [status, router]);

    if (session) {
        return (
            <button
                onClick={() => signOut({ callbackUrl: "/" })} // Redirect to home after logout
                className="px-4 py-2 bg-red-500 text-white rounded"
            >
                Sign out
            </button>
        );
    }

    return (
        <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })} // Redirect after login
            className="px-4 py-2 bg-blue-500 text-white rounded"
        >
            Sign in with Google
        </button>
    );
}
