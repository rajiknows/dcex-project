import { auth } from "@/lib/auth";
import ClientRedirect from "@/components/clientRedirect";

export default async function Home() {
    const user = await auth();
    return <ClientRedirect isAuthenticated={!!user} />;
}
