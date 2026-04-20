import type { PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className = "" }: CardProps) {
  return <div className={`glass-panel p-6 ${className}`}>{children}</div>;
}

