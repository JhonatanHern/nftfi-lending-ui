import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { type ReactNode } from "react";

import { Providers } from "./providers";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Wagmi",
  description: "Generated by create-wagmi",
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <Providers>
        <body className={inter.className}>
          <Header />
          <main className="p-12">{props.children}</main>
        </body>
      </Providers>
    </html>
  );
}