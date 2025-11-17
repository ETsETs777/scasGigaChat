"use client";
import { useState, useCallback } from "react";
import Toast, { ToastProps } from "@/src/components/Toast/Toast";

export const useToast = () => {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info", duration = 3000) => {
      const id = Math.random().toString(36).substring(7);
      const newToast: ToastProps & { id: string } = {
        id,
        message,
        type,
        duration,
        onClose: () => {
          setToasts((prev) => prev.filter((toast) => toast.id !== id));
        },
      };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const ToastContainer = () => (
    <div>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );

  return { showToast, ToastContainer };
};

