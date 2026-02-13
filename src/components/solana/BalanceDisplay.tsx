"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useSolanaBalance } from "@/hooks/useSolanaBalance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export function BalanceDisplay() {
  const { publicKey, connected } = useWallet();
  const { balance, isLoading, refetch } = useSolanaBalance();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect your wallet to view balance</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Wallet
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={refetch}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Public Key</p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded break-all">
              {publicKey?.toBase58()}
            </code>
            <Button variant="ghost" size="icon" onClick={copyAddress}>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Balance</p>
          <p className="text-2xl font-bold">
            {isLoading ? (
              "Loading..."
            ) : balance !== null ? (
              `${balance.toFixed(4)} SOL`
            ) : (
              "Error"
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
