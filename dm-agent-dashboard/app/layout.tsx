import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DashboardProvider } from "@/components/DashboardContext";
import { WidgetListener } from "@/components/sprout/WidgetListener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DM Agent Dashboard",
  description: "Delivery Manager Agent Dashboard — Engineering Pulse",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <DashboardProvider>
          <WidgetListener />
          <Sidebar />
          <Header />
          <main className="ml-20 pt-24 min-h-screen bg-background p-8">
            {children}
          </main>
        </DashboardProvider>
      </body>
    </html>
  );
}
