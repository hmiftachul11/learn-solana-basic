"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useWallets, usePrivy, type ConnectedWallet } from "@privy-io/react-auth";
import { address, createSolanaRpc } from "@solana/kit";

interface SolanaWallet extends ConnectedWallet {
  chainType: string;
}

const rpc = createSolanaRpc("https://api.devnet.solana.com");

export function useSolanaBalance() {
  const { wallets } = useWallets();
  const { user, ready } = usePrivy(); // Tambahkan 'ready' di sini

  const solanaAddress = useMemo(() => {
    // JANGAN lakukan pengecekan jika Privy belum ready
    if (!ready) return undefined;

    const activeWallet = (wallets as SolanaWallet[]).find((w) => w.chainType === 'solana');
    if (activeWallet?.address) return activeWallet.address;

    const linkedAccount = user?.linkedAccounts.find(
      (a) => a.type === 'wallet' && (a as { chainType?: string }).chainType === 'solana'
    ) as { address?: string } | undefined;
    return linkedAccount?.address;
  }, [wallets, user, ready]); // Masukkan 'ready' ke dalam dependency array

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    // Guard tambahan: pastikan ready dan address valid
    if (!ready || !solanaAddress || solanaAddress.startsWith('0x')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await rpc.getBalance(address(solanaAddress)).send();
      setBalance(Number(response.value) / 1_000_000_000);
    } catch (error) {
      console.error("Gagal mengambil saldo Solana:", error);
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [solanaAddress, ready]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { 
    balance, 
    isLoading, 
    refetch: fetchBalance, 
    solanaAddress 
  };
}