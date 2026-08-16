import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    leftIcon = null,
    rightIcon = null,
    className = '',
    type = 'text',
    disabled = false,
    ...props
  },
  ref
) {
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="block text-xs font-semibold text-chat-muted tracking-wide">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-chat-muted pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={`w-full bg-chat-sidebar text-chat-bubbleText text-sm rounded-xl border transition-all duration-150 outline-none placeholder:text-chat-muted/60 disabled:opacity-50 disabled:cursor-not-allowed ${
            leftIcon ? 'pl-10' : 'pl-3.5'
          } ${rightIcon ? 'pr-10' : 'pr-3.5'} py-2.5 ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
              : 'border-chat-border hover:border-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
          } ${className}`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 text-chat-muted flex items-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
      {!error && helperText && <p className="text-xs text-chat-muted">{helperText}</p>}
    </div>
  );
});

export default Input;
