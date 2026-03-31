import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-heading font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-3 border-foreground active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:-translate-x-[1px] hover:-translate-y-[1px] [box-shadow:var(--shadow-brutal)] hover:[box-shadow:var(--shadow-brutal-hover)]",
        destructive: "bg-destructive text-destructive-foreground hover:-translate-x-[1px] hover:-translate-y-[1px] [box-shadow:var(--shadow-brutal)] hover:[box-shadow:var(--shadow-brutal-hover)]",
        outline: "bg-background text-foreground hover:bg-muted [box-shadow:var(--shadow-brutal)] hover:[box-shadow:var(--shadow-brutal-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px]",
        secondary: "bg-secondary text-secondary-foreground hover:-translate-x-[1px] hover:-translate-y-[1px] [box-shadow:var(--shadow-brutal)] hover:[box-shadow:var(--shadow-brutal-hover)]",
        ghost: "border-transparent hover:bg-muted hover:text-foreground shadow-none",
        link: "border-transparent text-primary underline-offset-4 hover:underline shadow-none",
        accent: "bg-accent text-accent-foreground hover:-translate-x-[1px] hover:-translate-y-[1px] [box-shadow:var(--shadow-brutal)] hover:[box-shadow:var(--shadow-brutal-hover)]",
      },
      size: {
        default: "h-12 px-6 py-3 text-base rounded-lg",
        sm: "h-10 rounded-lg px-4 text-sm",
        lg: "h-14 rounded-lg px-10 text-lg",
        icon: "h-12 w-12 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
