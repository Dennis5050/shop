import React from 'react';

const variants = {
  primary: 'bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-sm focus-visible:ring-brand-500',
  secondary: 'bg-chat-header hover:bg-chat-hover text-chat-bubbleText font-medium border border-chat-border focus-visible:ring-slate-400',
  ghost: 'bg-transparent hover:bg-chat-hover text-chat-muted hover:text-chat-bubbleText',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-sm focus-visible:ring-rose-500',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm focus-visible:ring-emerald-500',
};

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5',
  icon: 'p-2 rounded-xl text-chat-muted hover:text-white',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`inline-flex items-center justify-center transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 outline-none ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

export default Button;
