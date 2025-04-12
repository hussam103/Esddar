import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StepProps {
  status?: "upcoming" | "current" | "complete";
  children: ReactNode;
  className?: string;
}

export function Step({ status = "upcoming", children, className }: StepProps) {
  return (
    <li
      className={cn(
        "relative flex items-center gap-2",
        className
      )}
    >
      {children}
    </li>
  );
}

export function StepLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("font-medium text-sm", className)}>
      {children}
    </span>
  );
}

export function StepDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-muted-foreground text-xs", className)}>
      {children}
    </span>
  );
}

export function StepSeparator({ className }: { className?: string }) {
  return (
    <div className={cn("absolute top-0 bottom-0 start-2.5 -translate-x-1/2 w-px bg-border", className)} />
  );
}

export function StepStatus({
  status = "upcoming",
  className,
}: {
  status?: "upcoming" | "current" | "complete";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative z-10 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background",
        status === "complete" && "bg-primary border-primary",
        status === "current" && "border-primary",
        className
      )}
    >
      {status === "complete" && (
        <svg
          className="h-3 w-3 text-primary-foreground"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {status === "current" && <div className="h-2 w-2 rounded-full bg-primary" />}
    </div>
  );
}

export function Steps({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ol className={cn("space-y-6", className)}>
      {children}
    </ol>
  );
}