import { CardContent } from "./ui/card";

export function BalanceBar({
    tokenBalances,
    copied,
    setCopied,
    user,
}: {
    tokenBalances: { totalBalance: number; tokens: any[] } | null;
    copied: boolean;
    setCopied: (value: boolean) => void;
    user: {
        solWallet: {
            publicKey: [];
        };
    };
}) {
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
                        {user.solWallet.publicKey.slice(0, 5)}...
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
                                navigator.clipboard.writeText(
                                    user.solWallet.publicKey,
                                );
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                        />
                    )}
                </div>
            </div>
        </CardContent>
    );
}
