import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "../src/components/ui/theme-provider";
import { PrefsProvider } from "../src/components/assetflow/layout/PrefsContext";
export const metadata = {
  title: "Inventos - IT Asset Management",
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PrefsProvider>
            {children}
          </PrefsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

