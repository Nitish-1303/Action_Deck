import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ActionDeck — Meetings in. Tasks out.",
  description:
    "Turn meeting transcripts into verifiable tasks, with exact quotes and no guessed owners or dates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
