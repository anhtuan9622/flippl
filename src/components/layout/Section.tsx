import React from 'react';

interface HeadingProps {
  title?: string;
  subtitle?: string;
}

function Heading({ title, subtitle }: HeadingProps) {
  if (!title && !subtitle) return null;

  return (
    <div className="flex flex-col flex-wrap items-center justify-center mb-8">
      {title && (
        <h2 className="text-3xl font-black text-black mb-2 text-center">
          {title}
        </h2>
      )}
      {subtitle && (
        <div className="text-sm font-medium text-gray-600">
          {subtitle}
        </div>
      )}
    </div>
  );
}

interface ContentProps {
  children: React.ReactNode;
  className?: string;
}

function Content({ children, className = '' }: ContentProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
}

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function Section({ children, title, subtitle, className = '' }: SectionProps) {
  return (
    <div className={`neo-brutalist-white p-6 mb-6 ${className}`}>
      <Heading title={title} subtitle={subtitle} />
      {children}
    </div>
  );
}

// Export sub-components for flexible usage
Section.Content = Content;