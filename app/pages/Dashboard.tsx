"use client";
import { RecoilRoot } from "recoil";
import WalletCard from "@/components/ui/wallet-card";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    async function fetchUserInfo() {
      const res = await fetch("/api/getinfo");
      if (res.ok) {
        const data = await res.json();
        setUserInfo(data);
      }
    }
    fetchUserInfo();
  }, []);

  return (
    <RecoilRoot>
      <div className="flex justify-center items-center min-h-screen p-4">
        {userInfo ? <WalletCard user={userInfo} /> : <p>Loading...</p>}
      </div>
    </RecoilRoot>
  );
}
