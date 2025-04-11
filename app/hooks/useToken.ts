import { TokenDetails } from "@/lib/tokens";
import { Network } from "@/app/dashboard/page";
import axios from "axios";
import { useEffect, useState } from "react";

export interface TokenWithbalance extends TokenDetails {
    balance: string;
    usdBalance: string;
}

export function useTokens(user: any, network: Network) {
    const [tokenBalances, setTokenBalances] = useState<{
        totalBalance: number;
        tokens: TokenWithbalance[];
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const publicKey = network === 'devnet' 
            ? user?.solWallet?.devnetPublicKey 
            : user?.solWallet?.publicKey;

        if (!publicKey) {
            console.error("Public key not found for the selected network.");
            setLoading(false);
            setTokenBalances(null);
            return;
        }
        
        setLoading(true);
        axios.get(`/api/tokens?network=${network}&address=${publicKey}`)
            .then((res) => {
                setTokenBalances(res.data);
            })
            .catch(error => {
                console.error("Failed to fetch token balances:", error);
                setTokenBalances(null);
            })
            .finally(() => {
                setLoading(false);
            });
            
    }, [user, network]);

    return {
        loading,
        tokenBalances,
    };
}
