"use client";

import { usePathname } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "@/context/ThemeContext";

export function ToastifyHost() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const onLanding = pathname === "/";
  const toastTheme =
    onLanding || theme === "dark" ? ("dark" as const) : ("light" as const);

  return (
    <ToastContainer
      position="bottom-right"
      autoClose={3200}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={toastTheme}
      toastStyle={{ border: "1px solid rgba(23, 207, 151, 0.45)" }}
      progressClassName="karbon-toastify-progress"
    />
  );
}
