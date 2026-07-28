import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Dr. Rafiq Zakaria College for Women",
  description: "Navkhanda, Jubilee Park, Aurangabad. Affiliated to Dr. Babasaheb Ambedkar Marathwada University.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#faf9f6] text-zinc-800 font-sans">
        <Header />
        <main className="flex-1 flex flex-col w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

