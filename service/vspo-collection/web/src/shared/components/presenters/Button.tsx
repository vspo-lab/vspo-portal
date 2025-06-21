import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  sparkle?: boolean;
  touchFriendly?: boolean;
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  sparkle = false,
  touchFriendly = false,
  className = "",
  ...props
}: ButtonProps) => {
  const baseClasses =
    "font-bold rounded-full transition-all duration-200 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 active:scale-95";

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl",
    secondary:
      "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl",
    accent:
      "bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 shadow-lg hover:shadow-xl",
    ghost:
      "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/50 hover:border-white/70",
  };

  const sizeClasses = {
    xs: "px-2 py-1 text-xs min-h-[32px]",
    sm: "px-3 py-2 text-sm min-h-[36px] sm:px-4",
    md: "px-4 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base min-h-[40px] sm:min-h-[44px]",
    lg: "px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg min-h-[44px] sm:min-h-[48px]",
  };

  const touchClasses = touchFriendly ? "min-h-[44px] min-w-[44px]" : "";

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${touchClasses} ${className}`}
      {...props}
    >
      {sparkle && (
        <span className="absolute inset-0 overflow-hidden">
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
        </span>
      )}
      <span className="relative z-10 flex items-center justify-center gap-1 sm:gap-2">
        {children}
      </span>
    </button>
  );
};
