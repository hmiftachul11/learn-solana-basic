"use client";

import { WalletButton } from "@/components/solana/WalletButton";
import { BalanceDisplay } from "@/components/solana/BalanceDisplay";
import { AirdropButton } from "@/components/solana/AirdropButton";
import { TransferForm } from "@/components/solana/TransferForm";
import { useSolanaBalance } from "@/hooks/useSolanaBalance";

export default function Home() {
  const { refetch } = useSolanaBalance();

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Solana Dashboard</h1>
          <WalletButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Balance Card */}
          <div className="lg:col-span-2">
            <BalanceDisplay />
          </div>

          {/* Airdrop Card */}
          <div>
            <AirdropButton onSuccess={refetch} />
          </div>

          {/* Transfer Card */}
          <div className="md:col-span-2 lg:col-span-3">
            <TransferForm onSuccess={refetch} />
          </div>
        </div>
      </div>
    </main>
  );
}
