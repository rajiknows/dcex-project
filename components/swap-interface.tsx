"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getLivePrice } from "@/lib/constants";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsable";
import { SUPPORTED_TOKENS, TokenDetails } from "@/lib/tokens";
import axios from "axios";

export function SwapInterface({ onBack }) {
    const tokens: TokenDetails[] = SUPPORTED_TOKENS;
    const [amount, setAmount] = useState("");
    const [baseAsset, setBaseAsset] = useState<TokenDetails>(tokens[0]);
    const [quoteAsset, setQuoteAsset] = useState<TokenDetails>(tokens[1]);
    const [showDetails, setShowDetails] = useState(false);
    const [derived, setDerived] = useState<number | null>(null);
    const [quoteResponse, setQuoteResponse] = useState<string>("");

    useEffect(() => {
        if (!amount) {
            setDerived(null);
            return;
        }

        async function fetchDerivedAmount() {
            const quoteResponse = await getLivePrice(
                baseAsset.mint,
                quoteAsset.mint,
                Number(amount),
                baseAsset.decimals,
            );

            const derivedAmount = quoteResponse.outAmount;

            setQuoteResponse(JSON.stringify(quoteResponse));
            // console.log("quoteresponse", quoteResponse);

            setDerived(Number(derivedAmount) / 10 ** quoteAsset.decimals);
        }

        fetchDerivedAmount();
    }, [amount, baseAsset, quoteAsset]);

    return (
        <Card className="w-full max-w-md mx-auto bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Header onBack={onBack} />
            </CardHeader>
            <CardContent className="space-y-4">
                <TokenInput
                    token={baseAsset}
                    setToken={setBaseAsset}
                    tokens={tokens}
                    amount={amount}
                    setAmount={setAmount}
                    label="You Pay:"
                />
                {/* Reverse icon */}
                <Button
                    variant="ghost"
                    className="w-8 h-8"
                    onClick={() => {
                        setBaseAsset(quoteAsset);
                        setQuoteAsset(baseAsset);
                    }}
                >
                    Reverse
                </Button>
                <TokenInput
                    token={quoteAsset}
                    setToken={setQuoteAsset}
                    tokens={tokens}
                    amount={derived ? derived.toFixed(6) : ""}
                    setAmount={() => {}}
                    label="You Receive:"
                    disabled
                />
                <SwapDetails
                    showDetails={showDetails}
                    setShowDetails={setShowDetails}
                />
                {/* <pre>{JSON.stringify(quoteResponse, null, 2)}</pre> */}
                <SwapActions quoteResponse={quoteResponse} amount={amount} />

                <SettingsButton />
            </CardContent>
        </Card>
    );
}

function Header({ onBack }) {
    return (
        <div className="flex items-center space-x-2">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onBack}
            >
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">Swap Tokens</h2>
        </div>
    );
}

function TokenInput({
    token,
    setToken,
    tokens,
    amount,
    setAmount,
    label,
    disabled = false,
}: {
    token: TokenDetails;
    setToken: (value: TokenDetails) => void;
    tokens: TokenDetails[];
    amount: string;
    setAmount: (value: string) => void;
    label: string;
    disabled?: boolean;
}) {
    return (
        <div className="rounded-lg border bg-card p-3 space-y-2">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="flex items-center space-x-2">
                <Select
                    value={token.name}
                    onValueChange={(value) => {
                        const selectedToken = tokens.find(
                            (t) => t.name === value,
                        );
                        if (selectedToken) setToken(selectedToken);
                    }}
                >
                    <SelectTrigger className="w-[120px]">
                        <SelectValue>{token.name}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {tokens.map((t) => (
                            <SelectItem key={t.name} value={t.name}>
                                <div className="flex items-center space-x-2">
                                    <img src={t.image} width={30} />
                                    <span>{t.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={disabled}
                    className="flex-1"
                />
            </div>
            <div className="text-xs text-muted-foreground">
                Current price: ${token.price} USD
            </div>
        </div>
    );
}

function SwapDetails({ showDetails, setShowDetails }) {
    return (
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between p-0 h-8"
                >
                    <span className="text-sm">View Swap Details</span>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span>1 SOL = 0 USDC</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Network Fee</span>
                    <span>~0.00001 SOL</span>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

function SwapActions({
    quoteResponse,
    amount,
}: {
    quoteResponse: string;
    amount: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <Button variant="outline" className="flex-1">
                Cancel
            </Button>
            <Button
                className="flex-1"
                disabled={!amount}
                onClick={() => swap(quoteResponse)}
            >
                Confirm & Swap
            </Button>
        </div>
    );
}

function SettingsButton() {
    return (
        <Button variant="ghost" size="icon" className="absolute top-4 right-4">
            <Settings2 className="h-4 w-4" />
        </Button>
    );
}

export async function swap(quoteResponse) {
    try {
        const jsonquoteResponse = JSON.parse(quoteResponse);
        // console.log({ jsonquoteResponse });

        // Send swap request
        const { data: swapResponse } = await axios.post("/api/swap", {
            quoteResponse: jsonquoteResponse,
        });

        console.log("Swap Transaction Successful:", swapResponse);
        return swapResponse;
    } catch (error) {
        console.error("Swap failed:", error);
        throw error;
    }
}
