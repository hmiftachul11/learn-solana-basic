# Belajar Solana: Client-Side Interactions

Dokumentasi ini menjelaskan cara berinteraksi dengan blockchain Solana menggunakan `@solana/web3.js` dan `@solana/wallet-adapter`.

---

## Daftar Isi

1. [Connect: Menghubungkan ke RPC Endpoint](#1-connect-menghubungkan-ke-rpc-endpoint)
2. [Read: Membaca Saldo (Balance)](#2-read-membaca-saldo-balance)
3. [Airdrop: Meminta SOL Devnet](#3-airdrop-meminta-sol-devnet)
4. [Transfer: Mengirim SOL](#4-transfer-mengirim-sol)
5. [Konsep Penting](#5-konsep-penting)
6. [Ringkasan Method](#6-ringkasan-method)

---

## 1. Connect: Menghubungkan ke RPC Endpoint

### Apa itu RPC?

RPC (Remote Procedure Call) adalah cara aplikasi berkomunikasi dengan blockchain Solana. Kita mengirim request ke RPC server, dan server mengembalikan data dari blockchain.

### Kode

**File:** `src/components/wrappers/AppWalletProvider.tsx`

```typescript
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";

// Mendapatkan URL RPC Devnet
const endpoint = clusterApiUrl("devnet");
// Hasil: "https://api.devnet.solana.com"

// ConnectionProvider membungkus seluruh aplikasi
export const AppWalletProvider = ({ children }) => {
  return (
    <ConnectionProvider endpoint={endpoint}>
      {children}
    </ConnectionProvider>
  );
};
```

### Penjelasan

| Konsep | Keterangan |
|--------|------------|
| `clusterApiUrl("devnet")` | Fungsi helper untuk mendapatkan URL RPC publik Solana |
| `ConnectionProvider` | Context provider yang menyediakan koneksi ke semua komponen child |
| `endpoint` | URL RPC server yang akan menerima request kita |

### Cluster yang Tersedia

| Cluster | URL | Keterangan |
|---------|-----|------------|
| `devnet` | https://api.devnet.solana.com | Untuk development & testing |
| `testnet` | https://api.testnet.solana.com | Untuk testing |
| `mainnet-beta` | https://api.mainnet-beta.solana.com | Production (SOL asli) |

### Cara Menggunakan Koneksi di Komponen

```typescript
import { useConnection } from "@solana/wallet-adapter-react";

function MyComponent() {
  const { connection } = useConnection();

  // `connection` sekarang bisa digunakan untuk semua operasi blockchain
  // Contoh: connection.getBalance(), connection.requestAirdrop(), dll.
}
```

---

## 2. Read: Membaca Saldo (Balance)

### Konsep Lamports vs SOL

Solana menggunakan **Lamports** sebagai unit terkecil, mirip seperti:
- **Wei** di Ethereum
- **Satoshi** di Bitcoin

```
1 SOL = 1,000,000,000 Lamports (1 milyar)
```

### Kode

**File:** `src/hooks/useSolanaBalance.ts`

```typescript
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";

export function useSolanaBalance() {
  const { connection } = useConnection();  // Ambil koneksi RPC
  const { publicKey } = useWallet();       // Ambil public key wallet user
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    try {
      // Panggil RPC method: getBalance
      const lamports = await connection.getBalance(publicKey);

      // Konversi Lamports ke SOL
      const sol = lamports / LAMPORTS_PER_SOL;

      setBalance(sol);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [connection, publicKey]);

  // Fetch balance ketika publicKey berubah
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, isLoading, refetch: fetchBalance };
}
```

### Penjelasan

| Konsep | Keterangan |
|--------|------------|
| `connection.getBalance(publicKey)` | RPC call untuk mendapatkan saldo dalam **Lamports** |
| `LAMPORTS_PER_SOL` | Konstanta = 1,000,000,000 |
| `publicKey` | Alamat wallet user (dari wallet adapter) |

### Alur Membaca Balance

```
PublicKey
    ↓
connection.getBalance(publicKey)
    ↓
Lamports (misal: 2500000000)
    ↓
÷ LAMPORTS_PER_SOL
    ↓
SOL (misal: 2.5 SOL)
```

### Contoh Penggunaan

```typescript
function BalanceDisplay() {
  const { balance, isLoading, refetch } = useSolanaBalance();

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <p>Balance: {balance} SOL</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

---

## 3. Airdrop: Meminta SOL Devnet

### Apa itu Airdrop?

Airdrop adalah cara mendapatkan SOL gratis di **Devnet** untuk keperluan testing. Ini hanya tersedia di Devnet, bukan di Mainnet.

### Kode

**File:** `src/components/solana/AirdropButton.tsx`

```typescript
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

function AirdropButton() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const requestAirdrop = async () => {
    if (!publicKey) return;

    try {
      // Step 1: Minta airdrop 1 SOL (dalam lamports)
      const signature = await connection.requestAirdrop(
        publicKey,
        1 * LAMPORTS_PER_SOL  // 1 SOL = 1,000,000,000 lamports
      );

      // Step 2: Ambil blockhash terbaru untuk konfirmasi
      const latestBlockhash = await connection.getLatestBlockhash();

      // Step 3: Tunggu konfirmasi transaksi
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      console.log("Airdrop berhasil! Signature:", signature);
    } catch (error) {
      console.error("Airdrop gagal:", error);
    }
  };

  return <button onClick={requestAirdrop}>Request 1 SOL</button>;
}
```

### Penjelasan Step-by-Step

| Step | Method | Keterangan |
|------|--------|------------|
| 1 | `requestAirdrop(pubkey, lamports)` | Minta SOL gratis dari faucet Devnet |
| 2 | `getLatestBlockhash()` | Ambil blockhash terbaru untuk konfirmasi |
| 3 | `confirmTransaction()` | Tunggu sampai transaksi dikonfirmasi di blockchain |

### Return Value

- `signature` = Transaction ID (string)
- Bisa dilihat di [Solana Explorer](https://explorer.solana.com/?cluster=devnet)

### Alur Airdrop

```
User klik "Request 1 SOL"
    ↓
requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL)
    ↓
Faucet Devnet mengirim SOL
    ↓
Return: signature (Transaction ID)
    ↓
getLatestBlockhash()
    ↓
confirmTransaction({ signature, blockhash, ... })
    ↓
Transaksi dikonfirmasi ✓
    ↓
Saldo bertambah 1 SOL
```

### Catatan Penting

- Airdrop hanya tersedia di **Devnet** dan **Testnet**
- Ada rate limit (tidak bisa spam request)
- Jika gagal, coba lagi beberapa menit kemudian

---

## 4. Transfer: Mengirim SOL

### Konsep SystemProgram

`SystemProgram` adalah program native Solana untuk operasi dasar seperti:
- Transfer SOL
- Create account
- Allocate space

### Kode

**File:** `src/components/solana/TransferForm.tsx`

```typescript
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

function TransferForm() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const handleTransfer = async (recipientAddress: string, amountSOL: number) => {
    if (!publicKey) return;

    try {
      // Step 1: Konversi address string ke PublicKey object
      const recipientPubkey = new PublicKey(recipientAddress);

      // Step 2: Konversi SOL ke Lamports
      const lamports = Math.round(amountSOL * LAMPORTS_PER_SOL);

      // Step 3: Buat instruksi transfer menggunakan SystemProgram
      const instruction = SystemProgram.transfer({
        fromPubkey: publicKey,      // Pengirim (wallet kita)
        toPubkey: recipientPubkey,  // Penerima
        lamports,                   // Jumlah dalam lamports
      });

      // Step 4: Buat Transaction dan tambahkan instruksi
      const transaction = new Transaction().add(instruction);

      // Step 5: Set blockhash dan fee payer
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Step 6: Kirim transaksi (wallet akan minta tanda tangan user)
      const signature = await sendTransaction(transaction, connection);

      // Step 7: Tunggu konfirmasi
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      console.log("Transfer berhasil! Signature:", signature);
    } catch (error) {
      console.error("Transfer gagal:", error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleTransfer("RECIPIENT_ADDRESS", 0.1);
    }}>
      {/* Form inputs */}
    </form>
  );
}
```

### Penjelasan Step-by-Step

| Step | Kode | Keterangan |
|------|------|------------|
| 1 | `new PublicKey(address)` | Konversi string ke objek PublicKey |
| 2 | `amountSOL * LAMPORTS_PER_SOL` | Konversi SOL ke Lamports |
| 3 | `SystemProgram.transfer({...})` | Buat instruksi transfer native Solana |
| 4 | `new Transaction().add(instruction)` | Bungkus instruksi dalam Transaction |
| 5 | `transaction.recentBlockhash = ...` | Set blockhash untuk validasi |
| 6 | `sendTransaction(tx, connection)` | Kirim ke wallet untuk ditandatangani |
| 7 | `confirmTransaction({...})` | Tunggu konfirmasi dari blockchain |

### Alur Transfer

```
User Input
├── Recipient: "ABC123..."
└── Amount: 0.5 SOL
        ↓
Validasi Address (PublicKey.isOnCurve)
        ↓
Konversi ke Lamports (0.5 × 1,000,000,000 = 500,000,000)
        ↓
Buat Instruksi SystemProgram.transfer({
  fromPubkey: wallet_kita,
  toPubkey: recipient,
  lamports: 500000000
})
        ↓
Buat Transaction + Set Blockhash
        ↓
sendTransaction()
        ↓
Wallet Popup: "Approve this transaction?"
        ↓
User Approve → Transaksi dikirim ke RPC
        ↓
confirmTransaction() → Tunggu masuk blockchain
        ↓
Selesai! ✓
├── Saldo pengirim berkurang
└── Saldo penerima bertambah
```

### Validasi Address

```typescript
const validateAddress = (address: string): boolean => {
  try {
    const pubkey = new PublicKey(address);
    // Check apakah valid public key di ed25519 curve
    return PublicKey.isOnCurve(pubkey.toBytes());
  } catch {
    return false;
  }
};
```

### Error Handling

```typescript
try {
  const signature = await sendTransaction(transaction, connection);
} catch (error) {
  if (error.message.includes("User rejected")) {
    // User membatalkan di wallet
    console.log("Transaction cancelled by user");
  } else {
    // Error lainnya (network, insufficient funds, dll)
    console.error("Transaction failed:", error);
  }
}
```

---

## 5. Konsep Penting

### 5.1 Lamports vs SOL

```
1 SOL = 1,000,000,000 Lamports

Contoh konversi:
- 0.5 SOL = 500,000,000 Lamports
- 2.5 SOL = 2,500,000,000 Lamports

// SOL ke Lamports
const lamports = sol * LAMPORTS_PER_SOL;

// Lamports ke SOL
const sol = lamports / LAMPORTS_PER_SOL;
```

### 5.2 PublicKey

PublicKey adalah alamat wallet di Solana (mirip address di Ethereum).

```typescript
import { PublicKey } from "@solana/web3.js";

// Dari string
const pubkey = new PublicKey("ABC123...");

// Ke string
const address = pubkey.toBase58();

// Validasi
const isValid = PublicKey.isOnCurve(pubkey.toBytes());
```

### 5.3 Transaction & Instruction

```
Transaction
└── berisi 1 atau lebih Instruction
    ├── Instruction 1: Transfer 0.1 SOL ke A
    ├── Instruction 2: Transfer 0.2 SOL ke B
    └── Instruction 3: ...

// Satu transaksi bisa berisi banyak instruksi (atomic)
const tx = new Transaction()
  .add(instruction1)
  .add(instruction2)
  .add(instruction3);
```

### 5.4 Blockhash

Setiap transaksi memerlukan `recentBlockhash` untuk:
- Mencegah replay attack
- Menentukan kapan transaksi expired

```typescript
const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
transaction.recentBlockhash = blockhash;
```

### 5.5 Signature

Setelah transaksi dikirim, kita mendapat `signature` (Transaction ID).

```typescript
const signature = await sendTransaction(transaction, connection);
// signature = "5UfgJ3v..."

// Lihat di Explorer
const url = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
```

---

## 6. Ringkasan Method

### Connection Methods

| Method | Input | Output | Keterangan |
|--------|-------|--------|------------|
| `getBalance(pubkey)` | PublicKey | number (lamports) | Ambil saldo |
| `requestAirdrop(pubkey, lamports)` | PublicKey, number | string (signature) | Minta SOL gratis |
| `getLatestBlockhash()` | - | { blockhash, lastValidBlockHeight } | Untuk konfirmasi tx |
| `confirmTransaction({...})` | signature + blockhash | status | Tunggu konfirmasi |

### Wallet Adapter Hooks

| Hook | Return | Keterangan |
|------|--------|------------|
| `useConnection()` | { connection } | Akses ke RPC connection |
| `useWallet()` | { publicKey, connected, sendTransaction, ... } | Akses ke wallet user |

### SystemProgram Methods

| Method | Input | Output | Keterangan |
|--------|-------|--------|------------|
| `SystemProgram.transfer({...})` | { fromPubkey, toPubkey, lamports } | TransactionInstruction | Instruksi transfer SOL |

### Helper Functions

| Function | Input | Output | Keterangan |
|----------|-------|--------|------------|
| `clusterApiUrl(cluster)` | "devnet" / "testnet" / "mainnet-beta" | string (URL) | Dapatkan RPC URL |
| `new PublicKey(address)` | string | PublicKey | Buat PublicKey object |
| `PublicKey.isOnCurve(bytes)` | Uint8Array | boolean | Validasi address |

---

## Referensi

- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)

---

## Setup Phantom Wallet untuk Devnet

1. Buka **Phantom** browser extension
2. Klik **hamburger menu** (kiri atas)
3. Pergi ke **Settings** > **Developer Settings**
4. Aktifkan **Testnet Mode**
5. Pilih **Solana Devnet**

Sekarang Phantom wallet akan berinteraksi dengan Devnet.
