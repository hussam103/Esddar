import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepsProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Steps({ value, onChange, readOnly = false, className, ...props }: StepsProps) {
  const [steps, setSteps] = React.useState<HTMLDivElement[]>([]);

  const handleClick = (index: number) => {
    if (readOnly) return;
    onChange?.(index);
  };

  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
      ref={(node) => {
        if (node) {
          const stepNodes = Array.from(node.querySelectorAll('[data-step]'));
          setSteps(stepNodes as HTMLDivElement[]);
        }
      }}
    >
      {React.Children.map(props.children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            index,
            active: index === value,
            complete: index < value,
            onClick: () => handleClick(index),
            readOnly,
          });
        }
        return child;
      })}
    </div>
  );
}

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  index?: number;
  active?: boolean;
  complete?: boolean;
  readOnly?: boolean;
}

export function Step({ index, active, complete, readOnly, ...props }: StepProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2",
        {
          "cursor-pointer": !readOnly,
        }
      )}
      data-step
      data-active={active}
      data-complete={complete}
      {...props}
    />
  );
}

interface StepStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  complete?: boolean;
}

export function StepStatus({ complete, className, ...props }: StepStatusProps) {
  return (
    <div
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold",
        {
          "bg-primary text-primary-foreground border-primary": complete,
          "border-muted-foreground": !complete,
        },
        className
      )}
      {...props}
    >
      {complete ? <Check className="h-3.5 w-3.5" /> : null}
    </div>
  );
}

export function StepLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  );
}

export function StepDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

export function StepSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("h-[var(--step-separator-height,2px)] w-full bg-muted", className)}
      {...props}
    />
  );
}