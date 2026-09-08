import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
        secondary:
          "border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200",
        destructive:
          "border-transparent bg-rose-100 text-rose-800 hover:bg-rose-200",
        outline: "border-slate-300 text-slate-700",
        success:
          "border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
        warning:
          "border-transparent bg-amber-100 text-amber-900 hover:bg-amber-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  colorHex?: string | null;
}

function Badge({ className, variant, colorHex, style, ...props }: BadgeProps) {
  const customStyle: React.CSSProperties = colorHex
    ? {
        backgroundColor: `${colorHex}35`, // ~20% opacity background
        borderColor: `${colorHex}80`, // ~50% opacity border
        color: "#1e293b", // high-contrast dark slate text
        ...style,
      }
    : style || {};

  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={customStyle}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
