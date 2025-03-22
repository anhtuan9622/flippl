import React from "react";
import { DivideIcon as LucideIcon } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger" | "ghost" | "select" | "link";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = "default",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "font-bold transition-all inline-flex items-center justify-center gap-2";

  const variantStyles = {
    default:
      "neo-brutalist-gray",
    primary:
      "neo-brutalist-blue",
    danger:
      "neo-brutalist-red",
    select:
      "neo-brutalist-yellow",
    ghost: "hover:bg-gray-100 text-gray-600 hover:text-black",
    link: "text-blue-600 hover:text-blue-800",
  };

  const sizeStyles = {
    sm: "px-2 py-1.5 text-sm",
    md: "px-3 py-2.5",
    lg: "px-6 py-4 text-lg",
  };

  const disabledStyles =
    disabled || loading
      ? "opacity-50 cursor-not-allowed"
      : "";
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${widthStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon className="w-4 h-4" />}
          {children}
          {Icon && iconPosition === "right" && <Icon className="w-4 h-4" />}
        </>
      )}
    </button>
  );
}
