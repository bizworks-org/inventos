"use client";

import { useTheme } from "next-themes@0.4.6";
import {
  Toaster as Sonner,
  ToasterProps,
  toast as sonnerToast,
} from "sonner@2.0.3";
import { useEffect } from "react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  useEffect(() => {
    console.log("[Toaster] MOUNTED", { sonnerToast: typeof sonnerToast });
    // Expose toast globally for debugging
    (window as any).__toast = sonnerToast;
    return () => {
      console.log("[Toaster] UNMOUNTED");
    };
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          zIndex: 999999,
          position: "fixed",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          background: "white",
          color: "black",
          border: "2px solid #e5e7eb",
          fontSize: "14px",
        },
      }}
      {...props}
    />
  );
};

// Re-export the shared toast singleton from sonner so all app modules use the same instance.
export { Toaster, sonnerToast as toast };
