import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Sum Vầy - Lắc Lộc Đầu Xuân 2026",
  description:
    "Lắc lì xì online - Tết 2026. Tạo phòng, share QR, lắc điện thoại nhận lộc!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-dvh tet-bg relative">
          {/* Watermark */}
          <div className="tet-watermark">LỘC</div>

          {/* Decorative lanterns */}
          <div className="fixed top-0 left-4 text-3xl sm:text-4xl animate-sway opacity-60 z-10 pointer-events-none" style={{ animationDelay: '0s' }}>🏮</div>
          <div className="fixed top-0 right-4 text-3xl sm:text-4xl animate-sway opacity-60 z-10 pointer-events-none" style={{ animationDelay: '1s' }}>🏮</div>

          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
