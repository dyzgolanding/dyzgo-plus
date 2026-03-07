import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; 
import ChatWidget from "@/components/ChatWidget"; // 🟢 Importamos el componente
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
  title: "DyzGO - Panel de Administración",
  description: "Marketplace de eventos y tickets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        
        {/* Script de Google Maps */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyDOZ9gVgcmAr19Ol35AzFGiuYR_8v8Mx-4&libraries=places`}
          strategy="beforeInteractive"
        />

        {/* 🟢 El chat se cargará solo si el usuario inició sesión */}
        <ChatWidget />
        
      </body>
    </html>
  );
}
