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
import { Network } from "@/app/dashboard/page"; // Import Network type
import { LAMPORTS_PER_SOL } from "@solana/web3.js"; // Import LAMPORTS_PER_SOL
import { Label } from "@/components/ui/label"; // Import Label for slippage

interface SwapInterfaceProps {
    onBack: () => void;
    network: Network; // Add network prop
}

export function SwapInterface({ onBack, network }: SwapInterfaceProps) { // Add network to props
    const [tokens, setTokens] = useState<TokenDetails[]>([]);
    const [amount, setAmount] = useState("");
    const [baseAsset, setBaseAsset] = useState<TokenDetails | undefined>(undefined);
    const [quoteAsset, setQuoteAsset] = useState<TokenDetails | undefined>(undefined);
    const [showDetails, setShowDetails] = useState(false);
    const [derived, setDerived] = useState<number | null>(null);
    const [quoteResponse, setQuoteResponse] = useState<string>("");
    const [loadingQuote, setLoadingQuote] = useState(false);
    const [swapping, setSwapping] = useState(false);
    const [slippageBps, setSlippageBps] = useState(50); // Default slippage: 0.5% (50 bps)
    const [error, setError] = useState<string | null>(null);

    // Update token list and defaults based on network
    useEffect(() => {
        // Filter tokens or adjust mint addresses based on network if needed
        // For now, we assume SUPPORTED_TOKENS structure handles this
        // or that the API handles the network parameter correctly.
        const networkTokens = SUPPORTED_TOKENS; // Potentially filter/map here
        setTokens(networkTokens);
        if (networkTokens.length > 0) {
            setBaseAsset(networkTokens[0]); // Default to first token (e.g., SOL)
        }
        if (networkTokens.length > 1) {
            setQuoteAsset(networkTokens[1]); // Default to second token (e.g., USDC)
        }
    }, [network]); // Re-run when network changes

    useEffect(() => {
        if (!amount || !baseAsset || !quoteAsset || Number(amount) <= 0) {
            setDerived(null);
            setQuoteResponse("");
            setError(null);
            return;
        }

        const debounceTimeout = setTimeout(() => {
             fetchDerivedAmount();
        }, 500); // Debounce API calls

        return () => clearTimeout(debounceTimeout);

    }, [amount, baseAsset, quoteAsset, network]); // Include network dependency

    async function fetchDerivedAmount() {
        if (!baseAsset || !quoteAsset) return;
        setLoadingQuote(true);
        setError(null);
        try {
            const baseMint = network === 'devnet' ? baseAsset.devnetMint : baseAsset.mint;
            const quoteMint = network === 'devnet' ? quoteAsset.devnetMint : quoteAsset.mint;
            
            const liveQuote = await getLivePrice(
                baseMint,
                quoteMint,
                Number(amount),
                baseAsset.decimals,
                network,
                slippageBps // Pass slippage
            );

            const derivedAmount = liveQuote.outAmount;
            setQuoteResponse(JSON.stringify(liveQuote));
            setDerived(Number(derivedAmount) / 10 ** quoteAsset.decimals);
        } catch (err) {
            console.error("Error fetching quote:", err);
            setError("Could not fetch price quote.");
            setDerived(null);
            setQuoteResponse("");
        } finally {
            setLoadingQuote(false);
        }
    }

    // Swap function needs modification to pass network
    async function handleSwap() {
        if (!quoteResponse || swapping) return;
        setSwapping(true);
        setError(null);
        try {
            const jsonquoteResponse = JSON.parse(quoteResponse);
            const { data: swapResponse } = await axios.post("/api/swap", {
                quoteResponse: jsonquoteResponse,
                network: network,
                slippageBps: slippageBps // Pass slippage to backend swap
            });
            console.log("Swap Transaction Successful:", swapResponse);
            // TODO: Add success feedback (e.g., toast notification)
            // TODO: Potentially reset form or trigger balance refresh
             onBack(); // Go back after successful swap
        } catch (err: any) {
            console.error("Swap failed:", err);
            setError(err?.response?.data?.error || "Swap transaction failed.");
            // TODO: Add error feedback
        } finally {
            setSwapping(false);
        }
    }

    // Slippage options in Basis Points (BPS)
    const slippageOptions = [10, 50, 100]; // 0.1%, 0.5%, 1.0%

    return (
        <Card className="w-full max-w-md mx-auto bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Header onBack={onBack} />
            </CardHeader>
            <CardContent className="space-y-4">
                <TokenInput
                    token={baseAsset}
                    setToken={setBaseAsset}
                    tokens={tokens} // Pass filtered/correct tokens
                    amount={amount}
                    setAmount={setAmount}
                    label="You Pay:"
                    network={network} // Pass network
                />
                {/* Reverse Button */}
                <div className="flex justify-center my-[-10px]">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full border bg-background hover:bg-muted z-10"
                        onClick={() => {
                            if (baseAsset && quoteAsset) {
                                const currentBase = baseAsset;
                                setBaseAsset(quoteAsset);
                                setQuoteAsset(currentBase);
                                // Optionally reset amount or derived amount
                                // setAmount(""); 
                            }
                        }}
                        disabled={!baseAsset || !quoteAsset}
                    >
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 2C7.77614 2 8 2.22386 8 2.5V12.5C8 12.7761 7.77614 13 7.5 13C7.22386 13 7 12.7761 7 12.5V2.5C7 2.22386 7.22386 2 7.5 2Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path><path d="M7.14645 1.14645C7.34171 0.951184 7.65829 0.951184 7.85355 1.14645L11.8536 5.14645C12.0488 5.34171 12.0488 5.65829 11.8536 5.85355C11.6583 6.04882 11.3417 6.04882 11.1464 5.85355L7.5 2.20711L3.85355 5.85355C3.65829 6.04882 3.34171 6.04882 3.14645 5.85355C2.95118 5.65829 2.95118 5.34171 3.14645 5.14645L7.14645 1.14645ZM7.85355 13.8536C7.65829 14.0488 7.34171 14.0488 7.14645 13.8536L3.14645 9.85355C2.95118 9.65829 2.95118 9.34171 3.14645 9.14645C3.34171 8.95118 3.65829 8.95118 3.85355 9.14645L7.5 12.7929L11.1464 9.14645C11.3417 8.95118 11.6583 8.95118 11.8536 9.14645C12.0488 9.34171 12.0488 9.65829 11.8536 9.85355L7.85355 13.8536Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </Button>
                 </div>
                <TokenInput
                    token={quoteAsset}
                    setToken={setQuoteAsset}
                    tokens={tokens} // Pass filtered/correct tokens
                    amount={derived ? derived.toFixed(6) : ""}
                    setAmount={() => {}} // Input is disabled
                    label="You Receive (estimated):"
                    disabled
                    network={network} // Pass network
                    loading={loadingQuote}
                />
                {/* Slippage Selection */}
                <div className="space-y-2 pt-2">
                    <Label className="text-sm text-muted-foreground">Slippage Tolerance</Label>
                    <div className="flex items-center space-x-2">
                        {slippageOptions.map((bps) => (
                            <Button 
                                key={bps}
                                variant={slippageBps === bps ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setSlippageBps(bps)}
                                className="flex-1"
                            >
                                {bps / 100}%
                            </Button>
                        ))}
                        {/* Optional: Add custom slippage input here */}
                    </div>
                </div>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <SwapDetails
                    showDetails={showDetails}
                    setShowDetails={setShowDetails}
                    baseAsset={baseAsset}
                    quoteAsset={quoteAsset}
                    amount={amount}
                    derived={derived}
                    network={network}
                    quoteResponse={quoteResponse} // Pass quote for details
                />
                <SwapActions 
                    quoteResponse={quoteResponse} 
                    amount={amount}
                    onSwap={handleSwap} // Use updated swap handler
                    swapping={swapping}
                />
                {/* <SettingsButton /> */}
            </CardContent>
        </Card>
    );
}

// Define Header props type
interface HeaderProps {
    onBack: () => void;
}

function Header({ onBack }: HeaderProps) { // Add type annotation
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

interface TokenInputProps {
    token: TokenDetails | undefined; // Can be undefined initially
    setToken: (value: TokenDetails) => void;
    tokens: TokenDetails[];
    amount: string;
    setAmount: (value: string) => void;
    label: string;
    disabled?: boolean;
    network: Network; // Add network
    loading?: boolean; // Add loading state for derived amount
}

function TokenInput({
    token,
    setToken,
    tokens,
    amount,
    setAmount,
    label,
    disabled = false,
    network, // Destructure network
    loading = false, // Destructure loading
}: TokenInputProps ) {
    // ... (rest of TokenInput implementation - needs update to use network for price display maybe)
    // Consider fetching token price based on network if necessary
    const displayPrice = token?.price ?? "0"; // Placeholder, might need network adjustment

    return (
        <div className="rounded-lg border bg-card p-3 space-y-2 relative">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="flex items-center space-x-2">
                <Select
                    value={token?.name}
                    onValueChange={(value) => {
                        const selectedToken = tokens.find((t) => t.name === value);
                        if (selectedToken) setToken(selectedToken);
                    }}
                    disabled={!tokens.length} // Disable if no tokens
                >
                     {/* Use token?.name for SelectValue */}
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select Token"> 
                            {token ? (
                                <div className="flex items-center space-x-2">
                                    <img src={token.image} width={20} height={20} alt={token.name} className="rounded-full" />
                                    <span>{token.name}</span>
                                </div>
                            ) : null}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {tokens.map((t) => (
                            <SelectItem key={t.name} value={t.name}>
                                <div className="flex items-center space-x-2">
                                    <img src={t.image} width={20} height={20} alt={t.name} className="rounded-full" />
                                    <span>{t.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={disabled}
                    className={`flex-1 ${loading ? 'opacity-50' : ''}`} // Show loading state
                />
            </div>
            {token && (
                <div className="text-xs text-muted-foreground">
                    {/* Display price - might need adjustment based on network */}
                    Price: ~${displayPrice} USD 
                </div>
            )}
             {loading && disabled && (
                <div className="absolute inset-0 flex items-center justify-end pr-12 pointer-events-none">
                    <svg className="animate-spin h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )}
        </div>
    );
}

interface SwapDetailsProps {
    showDetails: boolean;
    setShowDetails: (open: boolean) => void;
    baseAsset: TokenDetails | undefined;
    quoteAsset: TokenDetails | undefined;
    amount: string;
    derived: number | null;
    network: Network;
    quoteResponse: string; // Receive quoteResponse string
}

function SwapDetails({ 
    showDetails, 
    setShowDetails, 
    baseAsset, 
    quoteAsset, 
    amount, 
    derived, 
    network,
    quoteResponse // Destructure quoteResponse
}: SwapDetailsProps) {
    // Parse quoteResponse safely
    let rate = "N/A";
    let networkFee = "N/A";
    let priceImpact = "N/A";

    if (quoteResponse && baseAsset && quoteAsset && derived) {
        try {
            const parsedQuote = JSON.parse(quoteResponse);
            const inAmountLamports = parsedQuote.inAmount;
            const outAmountLamports = parsedQuote.outAmount;
            
            if (inAmountLamports && outAmountLamports) {
                const rateValue = (outAmountLamports / (10 ** quoteAsset.decimals)) / (inAmountLamports / (10 ** baseAsset.decimals));
                rate = `1 ${baseAsset.name} ≈ ${rateValue.toFixed(Math.min(quoteAsset.decimals, 6))} ${quoteAsset.name}`;
            }

            // Example: Extract fee (may vary based on quote provider API)
            const feeLamports = parsedQuote.routePlan?.[0]?.swapInfo?.feeAmount; 
            if (feeLamports) {
                networkFee = `~${(feeLamports / LAMPORTS_PER_SOL).toExponential(2)} SOL`; // Assuming fee is in SOL
            }

            priceImpact = `${parsedQuote.priceImpactPct}%`;

        } catch (e) {
            console.error("Error parsing quote details:", e);
        }
    }

    return (
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
             {/* ... CollapsibleTrigger ... */}
            <CollapsibleContent className="space-y-2 text-sm pt-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span>{rate}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Price Impact</span>
                    <span>{priceImpact}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Network Fee (est.)</span>
                    <span>{networkFee}</span>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

interface SwapActionsProps {
    quoteResponse: string;
    amount: string;
    onSwap: () => Promise<void>; // Function to trigger swap
    swapping: boolean; // Loading state for swap button
}

function SwapActions({ quoteResponse, amount, onSwap, swapping }: SwapActionsProps) {
    return (
        <div className="flex items-center justify-between gap-4">
            {/* <Button variant="outline" className="flex-1"> Cancel </Button> */}
            <Button
                className="flex-1"
                disabled={!amount || !quoteResponse || swapping}
                onClick={onSwap} // Call the passed swap handler
            >
                {swapping ? (
                     <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Swapping...
                     </>
                ) : (
                    'Confirm & Swap'
                )}
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
