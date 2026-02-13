"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
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
  const [error, setError] = useState("");

  const validateAddress = (address: string): boolean => {
    try {
      const pubkey = new PublicKey(address);
      // Check if it's a valid public key on the ed25519 curve
      return PublicKey.isOnCurve(pubkey.toBytes());
    } catch {
      return false;
    }
  };

  const handleTransfer = async () => {
    setError("");

    if (!publicKey) {
      toast.error("Wallet not connected");
      return;
    }

    // Validate recipient address
    if (!validateAddress(recipient)) {
      setError("Invalid Solana address");
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Invalid amount");
      return;
    }

    setIsLoading(true);
    try {
      const recipientPubkey = new PublicKey(recipient);
      const lamports = Math.round(amountNum * LAMPORTS_PER_SOL);

      // Create transfer instruction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      );

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      toast.success("Transfer successful!", {
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

      // Clear form
      setRecipient("");
      setAmount("");
      onSuccess?.();
    } catch (error: unknown) {
      console.error("Transfer failed:", error);

      // Handle user rejection
      if (error instanceof Error && error.message.includes("User rejected")) {
        toast.info("Transaction cancelled by user");
      } else {
        toast.error("Transfer failed", {
          description: "Please check your balance and try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Transfer SOL
        </CardTitle>
        <CardDescription>
          Send SOL to another wallet address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Address</Label>
          <Input
            id="recipient"
            placeholder="Enter Solana address"
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
              setError("");
            }}
            disabled={!connected || isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (SOL)</Label>
          <Input
            id="amount"
            type="number"
            step="0.001"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
            disabled={!connected || isLoading}
          />
        </div>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <Button
          onClick={handleTransfer}
          disabled={!connected || isLoading || !recipient || !amount}
          className="w-full"
        >
          {isLoading ? "Sending..." : "Send SOL"}
        </Button>
      </CardContent>
    </Card>
  );
}
