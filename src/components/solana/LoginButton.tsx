"use client";

import { usePrivy, useWallets, type ConnectedWallet } from "@privy-io/react-auth";

interface SolanaWallet extends ConnectedWallet {
  chainType: string;
}
import { Button } from "@/components/ui/button";
import { 
  LogIn, LogOut, Loader2, Wallet, 
  Copy, Check, ChevronDown, RefreshCw 
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LoginButton() {
  // Tambahkan getAccessToken dari usePrivy
  const { login, logout, authenticated, ready, user, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const [copied, setCopied] = useState(false);

  // LOG DEBUGGING: Buka console browser (F12) untuk melihat data ini
  if (authenticated) {
    console.log("DEBUG 1 - Data Profil User Mentah:", user?.linkedAccounts);
    console.log("DEBUG 2 - Status Array Wallet:", wallets);
  }

  // 1. Coba ambil dari hook useWallets (Ideal, butuh Iframe Proxy jalan)
  const solanaWallet = useMemo(() => {
    return (wallets as SolanaWallet[]).find((w) => w.chainType === 'solana');
  }, [wallets]);

  // 2. Fallback: Ambil langsung dari profil user (Kebal dari error Iframe Proxy)
  const userSolanaAccount = useMemo(() => {
    return user?.linkedAccounts.find(
      (account) => account.type === 'wallet' && (account as { chainType?: string }).chainType === 'solana'
    ) as { address?: string } | undefined;
  }, [user]);

  // Gabungkan hasil: Prioritaskan solanaWallet, jika gagal pakai fallback
  const activeAddress = solanaWallet?.address || userSolanaAccount?.address;
  const isEVM = activeAddress?.startsWith('0x');

  const copyAddress = async () => {
    if (activeAddress) {
      await navigator.clipboard.writeText(activeAddress);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // FUNGSI FORCE SYNC
  const handleForceSync = async () => {
    try {
      toast.loading("Syncing with Privy server...");
      // Memaksa Privy menarik data terbaru dari backend
      await getAccessToken(); 
      // Refresh halaman untuk mereset iframe proxy
      window.location.reload(); 
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Failed to sync state");
    }
  };

  if (!ready) {
    return (
      <Button disabled variant="outline">
        <Loader2 className="animate-spin h-4 w-4" />
      </Button>
    );
  }

  if (authenticated) {
    const label = activeAddress && !isEVM 
      ? `${activeAddress.slice(0, 4)}...${activeAddress.slice(-4)}` 
      : (user?.email?.address || user?.google?.email || "Connected");

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={`gap-2 ${isEVM ? 'border-red-500' : 'border-purple-500/50'}`}>
            <Wallet className={`h-4 w-4 ${isEVM ? 'text-red-500' : 'text-purple-500'}`} />
            {/* Tampilkan Address jika ada, atau "Network Error" jika EVM */}
            <span className="font-mono text-xs">{isEVM ? "Network Error" : label}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <p className="text-xs text-muted-foreground font-normal">Logged in as</p>
            <p className="text-sm font-medium truncate">
              {user?.email?.address || user?.google?.email || "Social User"}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {activeAddress && !isEVM ? (
            <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
              <Copy className="mr-2 h-4 w-4" />
              Copy Address
              {copied && <Check className="ml-auto h-4 w-4 text-green-500" />}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled className="text-xs text-red-500 italic">
              {isEVM ? "EVM Wallet Detected." : "Solana wallet not found."}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          
          {/* TOMBOL FORCE SYNC DITAMBAHKAN DI SINI */}
          <DropdownMenuItem 
            onClick={handleForceSync} 
            className="text-yellow-600 cursor-pointer font-medium focus:text-yellow-700 focus:bg-yellow-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Force Sync Privy State
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-500 cursor-pointer font-medium">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={login} className="bg-purple-600 hover:bg-purple-700 gap-2 text-white">
      <LogIn className="h-4 w-4" /> Connect Wallet
    </Button>
  );
}