"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react"; // Added Loader2 for animation
import { useState } from "react";
import { toast } from "sonner";

interface TransferFormProps {
  onSuccess?: () => void;
}

export function TransferForm({ onSuccess }: TransferFormProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Validasi address Solana
  const validateAddress = (address: string): boolean => {
    try {
      const pubkey = new PublicKey(address);
      return PublicKey.isOnCurve(pubkey.toBytes());
    } catch {
      return false;
    }
  };

  const handleTransfer = async () => {
    // 1. Basic Validation
    if (!publicKey || !connection) {
      toast.error("Wallet not connected");
      return;
    }

    if (!validateAddress(recipient)) {
      toast.error("Invalid recipient address", {
        description: "Please check the Solana address format.",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Invalid amount", {
        description: "Amount must be greater than 0.",
      });
      return;
    }

    // 2. Execution
    setIsLoading(true);
    const toastId = toast.loading("Processing transaction..."); // Simpan ID toast

    try {
      const recipientPubkey = new PublicKey(recipient);
      
      // Konversi SOL ke Lamports (Satuan terkecil)
      // Math.round digunakan untuk menghindari floating point error sederhana
      const lamports = Math.round(amountNum * LAMPORTS_PER_SOL);

      // A. Buat Instruksi Transfer
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      );

      // B. Ambil Blockhash Terbaru (Wajib di Solana modern)
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // C. Request User Signature & Kirim ke Jaringan
      // (Wallet Adapter otomatis handle signing di sini)
      const signature = await sendTransaction(transaction, connection);

      // D. Update Toast: Memberi tahu user kita sedang menunggu konfirmasi blok
      toast.message("Transaction Sent", {
        id: toastId, // Update toast yang sama
        description: "Waiting for confirmation on Solana Devnet...",
      });

      // E. Tunggu Konfirmasi (Finality)
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      // F. Sukses!
      toast.success("Transfer successful!", {
        id: toastId, // Ganti status toast loading tadi jadi sukses
        description: (
          <a
            href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500 hover:text-blue-600"
          >
            View on Solana Explorer
          </a>
        ),
        duration: 5000,
      });

      // G. Reset Form
      setRecipient("");
      setAmount("");
      
      // Refresh balance di parent component (jika ada)
      onSuccess?.();

    } catch (error: unknown) { 
      console.error("Transfer failed:", error);
      
      // 2. Siapkan variable pesan default
      let errorMessage = "An unknown error occurred";

      // 3. Lakukan pengecekan tipe (Type Guard)
      if (error instanceof Error) {
        // Jika error adalah instance dari object Error, kita aman ambil .message
        errorMessage = error.message;
      } else if (typeof error === "string") {
        // Jaga-jaga jika error berupa string biasa
        errorMessage = error;
      }

      // 4. Logika penanganan error menggunakan variable yang sudah aman
      if (errorMessage.includes("User rejected")) {
        toast.info("Transaction cancelled", {
          id: toastId,
          description: "You cancelled the signature request.",
        });
      } else {
        toast.error("Transfer failed", {
          id: toastId,
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Transfer SOL (Devnet)
        </CardTitle>
        <CardDescription>
          Send fake SOL to another devnet wallet address.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Input Recipient */}
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Address</Label>
          <Input
            id="recipient"
            placeholder="Paste Solana address here..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={!connected || isLoading}
            className="font-mono text-sm"
          />
        </div>

        {/* Input Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (SOL)</Label>
          <Input
            id="amount"
            type="number"
            step="0.1"
            min="0"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!connected || isLoading}
          />
        </div>

        {/* Action Button */}
        <Button
          onClick={handleTransfer}
          disabled={!connected || isLoading || !recipient || !amount}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Send SOL"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}