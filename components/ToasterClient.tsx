"use client";

import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";

export default function ToasterClient() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: isDark
          ? {
              background: "#1a1a2e",
              color: "#e5e7eb",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontSize: "14px",
            }
          : {
              background: "#ffffff",
              color: "#1e293b",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "12px",
              fontSize: "14px",
            },
      }}
    />
  );
}
