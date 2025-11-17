"use client";
import { useEffect, useState } from "react";
import styles from "./Toast.module.css";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`${styles.toast} ${styles[type]} ${
        isVisible ? styles.visible : styles.hidden
      }`}
      role="alert"
      aria-live="polite"
    >
      <span className={styles.message}>{message}</span>
      <button
        className={styles.closeButton}
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        aria-label="Закрыть уведомление"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;

