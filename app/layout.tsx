import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IntelliMan · Detección de objetos en vivo",
  description:
    "Detector de objetos en tiempo real desde la cámara, con grabación automática al aparecer una persona. Corre entero en el navegador: la imagen nunca sale de tu equipo.",
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `suppressHydrationWarning` es lo que indica next-themes: la clase del tema
    // la escribe un script antes de hidratar, así que servidor y cliente
    // arrancan necesariamente distintos en ese atributo.
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <I18nProvider>
            {children}
            <Toaster position="bottom-center" richColors />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
