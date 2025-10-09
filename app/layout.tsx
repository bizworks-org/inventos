import type { ReactNode } from "react";
import "./globals.css";
export const metadata = {
  title: "Plan That Trip. (Community)",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

