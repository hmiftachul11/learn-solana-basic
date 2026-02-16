"use client";

import { usePrivy } from "@privy-io/react-auth";
import { LoginButton } from "@/components/solana/LoginButton";
import { BalanceDisplay } from "@/components/solana/BalanceDisplay";
import { AirdropButton } from "@/components/solana/AirdropButton";
import { TransferForm } from "@/components/solana/TransferForm";
import { useSolanaBalance } from "@/hooks/useSolanaBalance";

export default function Home() {
  // ============================================
  // PRIVY AUTH STATE
  // ============================================
  const { ready, authenticated } = usePrivy();

  // ============================================
  // SOLANA BALANCE HOOK
  // ============================================
  const { refetch } = useSolanaBalance();

  // ============================================
  // LOADING STATE
  // ============================================
  if (!ready) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing Privy...</p>
        </div>
      </main>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Solana Dashboard</h1>
            <p className="text-xs text-muted-foreground font-mono">DEVNET MODE</p>
          </div>
          <LoginButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {!authenticated ? (
          // ============================================
          // NOT AUTHENTICATED: Show welcome message
          // ============================================
          <div className="max-w-md mx-auto text-center py-20 border rounded-2xl bg-card/30">
            <h2 className="text-2xl font-bold mb-4">Welcome to Your Wallet</h2>
            <p className="text-muted-foreground mb-8">
              Login with Google to automatically create your secure Solana embedded wallet.
            </p>
            <LoginButton />
          </div>
        ) : (
          // ============================================
          // AUTHENTICATED: Show dashboard layout
          // ============================================
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Balance Card - Main Info */}
            <div className="lg:col-span-2">
              <BalanceDisplay />
            </div>

            {/* Airdrop Tool - Quick Action */}
            <div className="flex flex-col gap-6">
              <AirdropButton onSuccess={refetch} />
              <div className="p-4 rounded-lg border border-dashed border-border bg-muted/20 text-center">
                <p className="text-xs text-muted-foreground italic">
                  More tools coming soon...
                </p>
              </div>
            </div>

            {/* Transfer Section - Full Width on Bottom */}
            <div className="md:col-span-2 lg:col-span-3">
              <TransferForm onSuccess={refetch} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}