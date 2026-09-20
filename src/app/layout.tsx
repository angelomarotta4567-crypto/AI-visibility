import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Visibility — AEO",
  description: "Diagnosi, misurazione, intervento e verifica della visibilità AI di un'azienda.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" data-theme="dark" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
