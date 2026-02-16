"use client";

import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { ReactNode, useEffect, useState } from "react";
import { Buffer } from "buffer";

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
}

type Chain = NonNullable<PrivyClientConfig['defaultChain']>;

const solanaDevnet: Chain = {
  id: 103, 
  name: 'Solana Devnet',
  network: 'solana-devnet',
  nativeCurrency: {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
  },
  rpcUrls: {
    default: { http: ['https://api.devnet.solana.com'] },
    public: { http: ['https://api.devnet.solana.com'] }
  },
};

export function PrivyAppProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID");

  if (!mounted) return <div style={{ visibility: "hidden" }}>{children}</div>;

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "google"],
        appearance: { theme: "dark", accentColor: "#9945FF" },
        supportedChains: [solanaDevnet],
        defaultChain: solanaDevnet,
        embeddedWallets: {
          solana: { createOnLogin: "users-without-wallets" },
          ethereum: { createOnLogin: "off" },
        },
        solana: {
          rpcs: {
            "solana:devnet": {
              rpc: createSolanaRpc("https://api.devnet.solana.com"),
              rpcSubscriptions: createSolanaRpcSubscriptions("wss://api.devnet.solana.com"),
            },
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}