"use client";
import ErrorBoundary from "@/src/components/ErrorBoundary/ErrorBoundary";

export default function ErrorBoundaryWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

