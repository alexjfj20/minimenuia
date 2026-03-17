import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ChatbotWidget } from "@/components/minimenu";
import { ToastProvider } from "@/contexts/ToastContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MINIMENU - Menú Digital para tu Negocio",
  description: "Digitaliza tu negocio con MINIMENU. Crea menús digitales, genera códigos QR, recibe pedidos online y gestiona tu restaurante desde cualquier lugar.",
  keywords: ["MINIMENU", "menú digital", "código QR", "pedidos online", "restaurante", "Colombia"],
  authors: [{ name: "MINIMENU Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "MINIMENU - Menú Digital para tu Negocio",
    description: "Digitaliza tu negocio con menús digitales y códigos QR",
    url: "https://minimenu.com",
    siteName: "MINIMENU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MINIMENU - Menú Digital",
    description: "Digitaliza tu negocio con menús digitales y códigos QR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ToastProvider>
          {children}
          <Toaster />
          <ChatbotWidget />
        </ToastProvider>
      </body>
    </html>
  );
}
