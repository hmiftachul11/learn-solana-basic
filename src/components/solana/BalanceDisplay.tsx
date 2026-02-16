"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSolanaBalance } from "@/hooks/useSolanaBalance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export function BalanceDisplay() {
  const { authenticated } = usePrivy();
  
  // Ambil solanaAddress langsung dari hook, tidak perlu lagi filter useWallets di sini!
  const { balance, isLoading, refetch, solanaAddress } = useSolanaBalance();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (solanaAddress) {
      await navigator.clipboard.writeText(solanaAddress);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // State saat user belum login
  if (!authenticated) {
    return (
      <Card>
        <CardContent>
          <p className="pt-6 text-center text-muted-foreground">Login to view wallet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Wallet Balance
          </span>
          {/* Tombol refresh dimatikan jika sedang loading atau alamat belum siap */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={refetch} 
            disabled={isLoading || !solanaAddress}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Address</p>
          <div className="flex items-center gap-2">
            {/* Tampilkan solanaAddress dari hook */}
            <code className="text-xs bg-muted px-2 py-1 rounded break-all flex-1">
              {solanaAddress || "Loading..."}
            </code>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={copyAddress} 
              disabled={!solanaAddress}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground mb-1">Balance (Devnet)</p>
          <p className="text-2xl font-bold font-mono">
            {isLoading ? "..." : `${balance?.toFixed(4) ?? "0"} SOL`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}