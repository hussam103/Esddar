import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const notificationVariants = cva(
  "relative w-full p-4 rounded-lg shadow-md transition-all duration-300 flex items-start gap-3 border",
  {
    variants: {
      variant: {
        default: "bg-background border-border",
        info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300",
        success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-900 dark:text-green-300",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-900 dark:text-yellow-300",
        error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-900 dark:text-red-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  title?: string;
  onClose?: () => void;
}

const getIcon = (variant: NonNullable<VariantProps<typeof notificationVariants>["variant"]>) => {
  const iconClasses = "h-5 w-5 mt-0.5";
  switch (variant) {
    case "info":
      return <Info className={`${iconClasses} text-blue-500 dark:text-blue-400`} />;
    case "success":
      return <CheckCircle className={`${iconClasses} text-green-500 dark:text-green-400`} />;
    case "warning":
      return <AlertTriangle className={`${iconClasses} text-yellow-500 dark:text-yellow-400`} />;
    case "error":
      return <AlertCircle className={`${iconClasses} text-red-500 dark:text-red-400`} />;
    default:
      return <Info className={`${iconClasses} text-foreground`} />;
  }
};

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  ({ className, children, variant = "default", title, onClose, ...props }, ref) => {
    const icon = getIcon(variant);
    
    return (
      <div
        ref={ref}
        className={cn(notificationVariants({ variant }), className)}
        {...props}
      >
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1">
          {title && <div className="font-semibold mb-1">{title}</div>}
          <div className={title ? "text-sm" : ""}>{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 -mr-1 -mt-1"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

Notification.displayName = "Notification";

export { Notification, notificationVariants };