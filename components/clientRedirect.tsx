"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClientRedirect({
    isAuthenticated,
}: {
    isAuthenticated: boolean;
}) {
    const router = useRouter();

    useEffect(() => {
        router.replace(isAuthenticated ? "/dashboard" : "/sign-in");
    }, [isAuthenticated, router]);

    return null;
}
