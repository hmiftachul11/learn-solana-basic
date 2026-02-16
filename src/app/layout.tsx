import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic"; // 1. Import dynamic

const inter = Inter({ subsets: ["latin"] });

// 2. Load PrivyProvider HANYA di browser (ssr: false)
const PrivyAppProvider = dynamic(
  () => import("@/components/providers/PrivyAppProvider").then((mod) => mod.PrivyAppProvider),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Solana Dashboard",
  description: "Powered by Privy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 3. Bungkus children Anda */}
        <PrivyAppProvider>
          {children}
        </PrivyAppProvider>
      </body>
    </html>
  );
}