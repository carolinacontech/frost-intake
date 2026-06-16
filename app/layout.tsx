import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Start your project — Market Open Media",
  description: "Tell us about your project and we'll build the perfect website for your business.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
