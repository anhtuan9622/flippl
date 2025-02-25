import React from "react";
import {
  CalendarDays,
  BarChart2,
  TrendingUp,
  BookOpenText,
} from "lucide-react";

interface Feature {
  icon: typeof CalendarDays;
  title: string;
  description: string;
}

interface FeaturesProps {
  title?: string;
  description?: string;
}

export default function Features({ title, description }: FeaturesProps) {
  const features: Feature[] = [
    {
      icon: CalendarDays,
      title: "Daily Tracking",
      description:
        "Log your P/L every day with an intuitive calendar view. Track the grind, spot patterns, and stay accountable.",
    },
    {
      icon: BarChart2,
      title: "Visual Analytics",
      description:
        "See your wins and losses through clean, no-nonsense charts that expose the truth. Because numbers don’t lie.",
    },
    {
      icon: TrendingUp,
      title: "Performance Metrics",
      description:
        "Track win rate, trade count, profit/loss ratio, and other key stats that actually matter.",
    },
    {
      icon: BookOpenText,
      title: "Trading Journal",
      description:
        "Keep receipts on your trades. Learn from your moves. Adjust. Improve.",
    },
  ];

  return (
    <div className="neo-brutalist-white p-8">
      {(title || description) && (
        <div className="text-center mb-8">
          {title && (
            <h2 className="text-4xl font-black text-black mb-4">{title}</h2>
          )}
          {description && (
            <p className="max-w-xl mx-auto text-lg text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <div key={index} className="neo-brutalist-gray p-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 neo-brutalist-yellow text-black flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-black mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="neo-brutalist-gray mt-8 flex flex-1 justify-center">
        <video width="w-100" height="h-100" controls>
          <source src="https://res.cloudinary.com/dqasshvcu/video/upload/v1740450454/arcvktljixajljvmo2w5.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
