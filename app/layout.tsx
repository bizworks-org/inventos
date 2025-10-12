import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "../src/components/ui/theme-provider";
export const metadata = {
  title: "AssetFlow - IT Asset Management",
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

