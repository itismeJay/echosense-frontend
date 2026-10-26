"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterClient() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--bg)",
          color: "var(--ink)",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          boxShadow: "var(--shadow-pop)",
          fontSize: "14px",
        },
      }}
    />
  );
}
