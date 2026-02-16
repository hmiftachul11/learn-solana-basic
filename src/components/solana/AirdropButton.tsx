"use client";

import { useState } from "react";
import { useWallets, type ConnectedWallet } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { address, lamports, type Address, type Rpc, type SolanaRpcApi } from "@solana/kit";

interface SolanaWallet extends ConnectedWallet {
  chainType: string;
  rpc?: Rpc<SolanaRpcApi>;
}

export function AirdropButton({ onSuccess }: { onSuccess?: () => void }) {
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);

  const requestAirdrop = async () => {
    const solanaWallet = (wallets as SolanaWallet[]).find((w) => w.chainType === "solana");
    if (!solanaWallet || !solanaWallet.rpc) {
      toast.error("Solana wallet not found");
      return;
    }

    setLoading(true);
    try {
      await solanaWallet.rpc.requestAirdrop(
        address(solanaWallet.address as Address),
        lamports(BigInt(1_000_000_000)) // 1 SOL
      ).send();
      
      toast.success("Airdrop success! 1 SOL added.");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Airdrop failed. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Faucet</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={requestAirdrop} 
          disabled={loading} 
          className="w-full gap-2"
          variant="secondary"
        >
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Droplets className="h-4 w-4" />}
          Request 1 SOL
        </Button>
      </CardContent>
    </Card>
  );
}