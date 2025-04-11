export interface TokenDetails {
    name: string;
    mint: string; // Mainnet Mint
    devnetMint: string; // Devnet Mint
    native: boolean;
    price: string;
    image: string;
    decimals: number;
}

export const SOLANA_DEVNET_MINT = "So11111111111111111111111111111111111111112";
export const USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export const SUPPORTED_TOKENS: TokenDetails[] = [
    {
        name: "SOL",
        mint: "So11111111111111111111111111111111111111112",
        devnetMint: SOLANA_DEVNET_MINT,
        native: true,
        price: "180",
        image: "https://upload.wikimedia.org/wikipedia/commons/3/34/Solana_cryptocurrency_two.jpg",
        decimals: 9,
    },
    {
        name: "USDC",
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        devnetMint: USDC_DEVNET_MINT,
        native: false,
        price: "1",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1vAKYEl0YffTpWSxrqEi_gmUsl-0BuXSKMQ&s",
        decimals: 6,
    },
    {
        name: "USDT",
        mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        devnetMint: "", // TODO: Add Devnet USDT Mint if needed
        native: false,
        price: "1",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvSxrpym7ij1Hf6zQOltcDORlrJGyj1kPf3A&s",
        decimals: 6,
    },
];
