import React, { forwardRef } from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  error?: string;
  label?: string;
  rightElement?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon: Icon, error, label, rightElement, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-black text-black mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          )}
          <input
            ref={ref}
            className={`
              neo-input w-full
              ${Icon ? 'pl-10' : 'px-3'}
              ${rightElement ? 'pr-10' : 'pr-3'}
              ${error ? 'border-red-500 focus:border-red-500' : ''}
              ${className}
            `}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <div className="text-sm text-red-600 font-medium">{error}</div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;