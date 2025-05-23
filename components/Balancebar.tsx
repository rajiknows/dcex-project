import { CardContent } from "./ui/card";
import { TokenWithbalance } from "@/app/hooks/useToken";

interface BalanceBarProps {
    tokenBalances: { totalBalance: number; tokens: TokenWithbalance[] } | null;
    copied: boolean;
    setCopied: (value: boolean) => void;
    user: any;
    publicAddress: string;
}

export function BalanceBar({
    tokenBalances,
    copied,
    setCopied,
    user,
    publicAddress,
}: BalanceBarProps) {
    return (
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2">
                    <span className="text-4xl font-bold">
                        ${tokenBalances?.totalBalance}
                    </span>
                    <span className="text-xl text-gray-500 dark:text-gray-400">
                        USD
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Wallet:
                    </span>
                    <span className="text-sm font-mono text-gray-800 dark:text-gray-200">
                        {publicAddress ? `${publicAddress.substring(0, 4)}...${publicAddress.substring(publicAddress.length - 4)}` : 'N/A'}
                    </span>
                    {copied && (
                        <span className="text-sm text-green-500 dark:text-green-400">
                            Copied!
                        </span>
                    )}
                    {!copied && (
                        <img
                            src="/copy.svg"
                            alt="Copy"
                            width={16}
                            height={16}
                            className="cursor-pointer opacity-70 hover:opacity-100"
                            onClick={() => {
                                if (publicAddress) {
                                    navigator.clipboard.writeText(publicAddress);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        </CardContent>
    );
}
