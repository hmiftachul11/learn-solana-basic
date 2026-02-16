"use client";

import { useWallets, ConnectedWallet } from "@privy-io/react-auth";
import {
  address,
  Address,
  lamports,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  compileTransaction,
  getBase64EncodedWireTransaction,
  createNoopSigner,
  createSolanaRpc // 1. Tambahkan import ini
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import bs58 from "bs58";

// 2. Buat instance RPC secara mandiri (Sama seperti di useSolanaBalance)
const rpc = createSolanaRpc("https://api.devnet.solana.com");

// Hapus rpc dari interface, karena Privy tidak menyediakannya
interface SolanaConnectedWallet extends ConnectedWallet {
  chainType: 'solana';
  signAndSendTransaction: (params: {
    chain: string;
    transaction: string;
  }) => Promise<{ signature: Uint8Array }>;
}

export function TransferForm({ onSuccess }: { onSuccess?: () => void }) {
  const { wallets } = useWallets();
  
  // 3. Cari dompet Solana dengan aman, jangan gunakan index [0]
  const activeWallet = useMemo(() => {
    return wallets.find((w) => w.chainType === 'solana') as SolanaConnectedWallet | undefined;
  }, [wallets]);

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async () => {
    // 4. Perbaiki guard ini (Hapus pengecekan rpc)
    if (!activeWallet?.address) {
      toast.error("Wallet not connected");
      return;
    }

    // Validasi input tambahan
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("Invalid amount");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Processing transaction...");

    try {
      // 5. Gunakan instance RPC mandiri untuk mengambil blockhash
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

      const sourceAddress = address(activeWallet.address as Address);
      const sourceSigner = createNoopSigner(sourceAddress);

      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (msg) => setTransactionMessageFeePayer(sourceAddress, msg),
        (msg) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, msg),
        (msg) => appendTransactionMessageInstruction(
          getTransferSolInstruction({
            destination: address(recipient as Address),
            amount: lamports(BigInt(Math.floor(parseFloat(amount) * 1_000_000_000))),
            source: sourceSigner,
          }),
          msg
        )
      );

      const transaction = compileTransaction(transactionMessage);
      const wireTransaction = getBase64EncodedWireTransaction(transaction);

      // Sign & Send via Privy
      const result = await activeWallet.signAndSendTransaction({
        chain: "solana:devnet",
        transaction: wireTransaction, 
      });

      const signature = bs58.encode(result.signature);

      toast.success("Transfer Success!", {
        id: toastId,
        description: (
          <a 
            href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} 
            target="_blank" 
            className="underline text-xs text-blue-500"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        )
      });

      setRecipient("");
      setAmount("");
      onSuccess?.();
    } catch (error) {
      const err = error as Error;
      console.error(err);
      toast.error("Transfer failed", { id: toastId, description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-purple-500" />
          Transfer SOL
        </CardTitle>
        <CardDescription>Pure Type-Safe Solana v2 Implementation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient</Label>
          <Input 
            id="recipient" 
            placeholder="Solana Address" 
            value={recipient} 
            onChange={(e) => setRecipient(e.target.value)}
            className="font-mono text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input 
            id="amount" 
            type="number" 
            placeholder="0.1" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
          />
        </div>
        <Button 
          onClick={handleTransfer} 
          disabled={isLoading || !activeWallet || !recipient || !amount}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Send Now"}
        </Button>
      </CardContent>
    </Card>
  );
}