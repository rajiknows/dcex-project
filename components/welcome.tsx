import Image from "next/image";
import { CardHeader } from "./ui/card";

interface WelcomeProps {
    user: any;
    publicAddress: string;
}

export function Welcome({ user, publicAddress }: WelcomeProps) {
    return (
        <CardHeader className="space-y-1">
            <div className="flex items-center space-x-2">
                <Image
                    src={user.profilePicture || "/placeholder.svg"}
                    alt="User"
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full"
                />
                <h2 className="text-xl font-semibold">
                    Welcome back, {user.name || user.username}!
                </h2>
            </div>
            <p className="text-sm text-muted-foreground">
                Your Wallet: {publicAddress ? `${publicAddress.substring(0, 4)}...${publicAddress.substring(publicAddress.length - 4)}` : 'N/A'} 
            </p>
        </CardHeader>
    );
}
