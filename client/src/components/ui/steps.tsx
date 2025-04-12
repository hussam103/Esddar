import { createContext, useContext, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle } from "lucide-react";

interface StepsContextValue {
  value: number;
  onChange: (value: number) => void;
}

const StepsContext = createContext<StepsContextValue | null>(null);

function useStepsContext() {
  const context = useContext(StepsContext);
  if (!context) {
    throw new Error("useStepsContext must be used within a Steps component");
  }
  return context;
}

interface StepProps {
  children: ReactNode;
  className?: string;
  value: number;
}

export function Step({ children, className, value }: StepProps) {
  const { value: currentValue, onChange } = useStepsContext();
  const isActive = currentValue === value;
  
  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-2",
        {
          "text-foreground": isActive,
          "text-muted-foreground": !isActive,
        },
        className
      )}
      role="button"
      aria-current={isActive ? "step" : undefined}
      onClick={() => onChange(value)}
    >
      {children}
    </div>
  );
}

export function StepLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-sm font-medium", className)}>
      {children}
    </span>
  );
}

export function StepDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {children}
    </span>
  );
}

export function StepSeparator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "ms-4 hidden h-6 border-s border-border sm:block",
        className
      )}
    />
  );
}

export function StepStatus({ complete }: { complete?: boolean }) {
  if (complete) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <CheckCircle className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-border bg-background">
      <Circle className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

interface StepsProps {
  children: ReactNode;
  className?: string;
  value: number;
  onChange: (value: number) => void;
}

export function Steps({ children, className, value, onChange }: StepsProps) {
  return (
    <StepsContext.Provider value={{ value, onChange }}>
      <div
        className={cn(
          "flex flex-col items-start gap-8 sm:flex-row sm:gap-0",
          className
        )}
      >
        {children}
      </div>
    </StepsContext.Provider>
  );
}