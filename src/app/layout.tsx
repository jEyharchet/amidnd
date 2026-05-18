import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amidnd",
  description: "Hola mundo con pergamino y Neon Postgres",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
