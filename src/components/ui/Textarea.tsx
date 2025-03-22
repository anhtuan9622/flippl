import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, label, className = '', ...props }, ref) => {
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
          <textarea
            maxlength="500"
            ref={ref}
            className={`
              neo-input w-full h-[120px]
              ${error ? 'border-red-500 focus:border-red-500' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <div className="text-sm text-red-600 font-medium">{error}</div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;