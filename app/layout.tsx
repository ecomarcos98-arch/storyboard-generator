import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Storyboard Generator",
  description: "Convert narration scripts into visual storyboards using AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
