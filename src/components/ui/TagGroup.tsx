import React from "react";

export interface TagGroupProps {
  tags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  disabled?: boolean;
  label?: string;
}

export default function TagGroup({
  tags,
  label,
  selectedTags,
  onTagToggle,
  disabled = false,
}: TagGroupProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-black text-black mb-2">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onTagToggle(tag)}
            disabled={disabled}
            className={`
            px-2 py-1 text-xs font-bold
            ${
              selectedTags.includes(tag)
                ? "neo-brutalist-yellow text-black"
                : "neo-brutalist-gray"
            }
          `}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
