"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AirdropButtonProps {
  onSuccess?: () => void;
}

export function AirdropButton({ onSuccess }: AirdropButtonProps) {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const requestAirdrop = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      const signature = await connection.requestAirdrop(
        publicKey,
        1 * LAMPORTS_PER_SOL
      );

      // Wait for confirmation
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      toast.success("Airdrop successful!", {
        description: (
          <a
            href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View transaction
          </a>
        ),
      });

      onSuccess?.();
    } catch (error) {
      console.error("Airdrop failed:", error);
      toast.error("Airdrop failed", {
        description: "Rate limit reached or faucet busy. Try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          Airdrop
        </CardTitle>
        <CardDescription>
          Request free SOL from the Devnet faucet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={requestAirdrop}
          disabled={!connected || isLoading}
          className="w-full"
        >
          {isLoading ? "Requesting..." : "Request 1 SOL"}
        </Button>
      </CardContent>
    </Card>
  );
}
