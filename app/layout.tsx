import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ghost AI",
  description: "Ghost AI — your intelligent writing partner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full bg-background antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ClerkProvider
          appearance={{
            theme: dark,
            variables: {
              colorBackground: "var(--color-bg-surface)",
              colorInput: "var(--color-bg-elevated)",
              colorInputForeground: "var(--color-text-primary)",
              colorForeground: "var(--color-text-primary)",
              colorMutedForeground: "var(--color-text-secondary)",
              colorPrimary: "var(--color-accent-primary)",
              colorPrimaryForeground: "var(--color-bg-base)",
              colorDanger: "var(--color-state-error)",
              colorSuccess: "var(--color-state-success)",
              colorBorder: "var(--color-border-default)",
              colorNeutral: "var(--color-text-primary)",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
