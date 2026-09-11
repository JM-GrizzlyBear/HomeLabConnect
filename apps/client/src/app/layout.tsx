import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HomeLabConnect",
  description: "Hospital management service",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
