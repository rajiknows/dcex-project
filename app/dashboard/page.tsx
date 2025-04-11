"use client";
import { RecoilRoot } from "recoil";
import WalletCard from "@/components/wallet-card";
import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/lib/constants";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export type Network = "mainnet" | "devnet";

export default function Dashboard() {
    const [userInfo, setUserInfo] = useState(null);
    const [network, setNetwork] = useState<Network>("mainnet");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUserInfo() {
            setLoading(true);
            try {
                const res = await fetch(`${BACKEND_URL}/getinfo?network=${network}`);
                if (res.ok) {
                    const data = await res.json();
                    setUserInfo(data);
                } else {
                    console.error("Failed to fetch user info:", res.status);
                    setUserInfo(null);
                }
            } catch (error) {
                console.error("Error fetching user info:", error);
                setUserInfo(null);
            } finally {
                setLoading(false);
            }
        }
        fetchUserInfo();
    }, [network]);

    const handleNetworkChange = (checked: boolean) => {
        setNetwork(checked ? "devnet" : "mainnet");
    };

    return (
        <RecoilRoot>
            <div className="flex flex-col justify-center items-center min-h-screen p-4 gap-4">
                <div className="flex items-center space-x-2 mb-4">
                    <Label htmlFor="network-switch">Mainnet</Label>
                    <Switch
                        id="network-switch"
                        checked={network === "devnet"}
                        onCheckedChange={handleNetworkChange}
                    />
                    <Label htmlFor="network-switch">Devnet</Label>
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : userInfo ? (
                    <WalletCard user={userInfo} network={network} />
                ) : (
                    <p>Failed to load user information.</p>
                )}
            </div>
        </RecoilRoot>
    );
}
