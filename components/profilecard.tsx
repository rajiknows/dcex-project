import Image from "next/image";

export function ProfileCard({ token }) {
    return (
        <li
            key={token.name}
            className="flex justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-md"
        >
            <div className=" flex space-x-1">
                {/* we need to display the token image that is toke.image with nextjs image componnet   */}
                <Image
                    src={token.image}
                    alt={token.name}
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full"
                />
                <span className="font-medium">{token.name}</span>
            </div>
            <span className="text-gray-700 dark:text-gray-300">
                {token.balance}
            </span>
        </li>
    );
}
