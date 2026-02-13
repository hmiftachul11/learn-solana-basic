"use client";

import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";

export function WalletButton() {
  const { setVisible } = useWalletModal();
  const { publicKey, disconnect, connecting, connected } = useWallet();

  const handleClick = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  const getButtonText = () => {
    if (connecting) return "Connecting...";
    if (connected && publicKey) {
      const address = publicKey.toBase58();
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
    return "Select Wallet";
  };

  return (
    <Button
      onClick={handleClick}
      variant={connected ? "outline" : "default"}
      className="gap-2"
    >
      {connected ? <LogOut className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
      {getButtonText()}
    </Button>
  );
}
