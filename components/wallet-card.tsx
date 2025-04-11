"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useTokens } from "../app/hooks/useToken";
import { ProfileCard } from "./profilecard";
import { SwapInterface } from "./swap-interface";
import { BalanceBar } from "./Balancebar";
import { Welcome } from "./welcome";
import { Network } from "@/app/dashboard/page";

export default function WalletCard({ user, network }: { user: any, network: Network }) {
    const [copied, setCopied] = useState(false);
    const { tokenBalances, loading } = useTokens(user, network);
    
    const publicAddress = network === 'devnet' 
        ? user?.solWallet?.devnetPublicKey 
        : user?.solWallet?.publicKey;

    const [viewMode, setViewMode] = useState<"default" | "swap" | "send">(
        "default",
    );

    return (
        <Card className="w-full max-w-2xl bg-white">
            <Welcome user={user} publicAddress={publicAddress} />
            <BalanceBar
                tokenBalances={tokenBalances}
                copied={copied}
                setCopied={setCopied}
                user={user}
                publicAddress={publicAddress}
            />

            <CardContent className="space-y-6">
                {viewMode === "default" ? (
                    <>
                        <div className="grid grid-cols-4 gap-2">
                            <Button
                                variant="default"
                                onClick={() => setViewMode("send")}
                            >
                                Send
                            </Button>
                            <Button
                                variant="default"
                                onClick={() => setViewMode("swap")}
                            >
                                Swap
                            </Button>
                        </div>

                        <Tabs className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="tokens">Tokens</TabsTrigger>
                                <TabsTrigger value="nfts">NFTs</TabsTrigger>
                                <TabsTrigger value="activity">
                                    Activity
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="tokens" className="mt-4">
                                {loading ? (
                                    <p className="text-center text-muted-foreground">
                                        Loading tokens...
                                    </p>
                                ) : tokenBalances?.tokens.length ? (
                                    <ul className="space-y-2">
                                        {tokenBalances.tokens.map((token) => (
                                            <ProfileCard
                                                key={token.name}
                                                token={token}
                                            />
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-muted-foreground">
                                        No tokens found for {network}.
                                    </p>
                                )}
                            </TabsContent>
                            <TabsContent value="nfts">
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">
                                        No NFTs found
                                    </p>
                                </div>
                            </TabsContent>
                            <TabsContent value="activity">
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">
                                        No recent activity
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </>
                ) : (
                    <SwapInterface onBack={() => setViewMode("default")} network={network} />
                )}
            </CardContent>
        </Card>
    );
}
