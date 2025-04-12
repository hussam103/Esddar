import { cn } from "@/lib/utils";
import { ReactNode, createContext, useContext, useState } from "react";
import { motion } from "framer-motion";

interface StepsContextValue {
  value: number;
  onChange: (value: number) => void;
}

const StepsContext = createContext<StepsContextValue | null>(null);

function useStepsContext() {
  const context = useContext(StepsContext);
  if (!context) {
    throw new Error("Steps components must be used within a Steps component");
  }
  return context;
}

interface StepProps {
  children: ReactNode;
  className?: string;
  value: number;
}

export function Step({ children, className, value }: StepProps) {
  const { value: activeStep } = useStepsContext();
  
  let status: "upcoming" | "current" | "complete" = "upcoming";
  
  if (value === activeStep) {
    status = "current";
  } else if (value < activeStep) {
    status = "complete";
  }
  
  return (
    <li
      className={cn(
        "relative flex items-center gap-2 cursor-pointer",
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
  complete,
  className,
}: {
  complete?: boolean;
  className?: string;
}) {
  const { value: activeStep } = useStepsContext();
  
  return (
    <motion.div
      className={cn(
        "relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-background transition-colors",
        complete && "bg-primary border-primary",
        !complete && activeStep === parseInt(Object.keys(className || {})[0] || "0") && "border-primary",
        className
      )}
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.2 }}
    >
      {complete ? (
        <motion.svg
          className="h-3.5 w-3.5 text-primary-foreground"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          />
        </motion.svg>
      ) : (
        <motion.div 
          className={cn(
            "h-2 w-2 rounded-full",
            activeStep === parseInt(Object.keys(className || {})[0] || "0") ? "bg-primary" : "bg-border"
          )}
          initial={{ scale: 0 }}
          animate={{ scale: activeStep === parseInt(Object.keys(className || {})[0] || "0") ? 1 : 0.5 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
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
      <ol className={cn("space-y-6", className)}>
        {children}
      </ol>
    </StepsContext.Provider>
  );
}