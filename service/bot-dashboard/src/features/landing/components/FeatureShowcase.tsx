import { useState } from "react";

export interface FeatureItem {
  id: string;
  icon: "list" | "filter" | "realtime" | "settings";
  title: string;
  description: string;
  iconColor: string;
  iconBgColor: string;
}

interface FeatureShowcaseProps {
  features: FeatureItem[];
  closeLabel: string;
  imagePlaceholder: string;
}

const featureIcons: Record<FeatureItem["icon"], string> = {
  list: "M4 6h16M4 10h16M4 14h16M4 18h16",
  filter:
    "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
  realtime: "M13 10V3L4 14h7v7l9-11h-7z",
  settings:
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
};

export function FeatureShowcase({
  features,
  closeLabel,
  imagePlaceholder,
}: FeatureShowcaseProps) {
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);
  const activeFeature = features.find((f) => f.id === activeFeatureId);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {features.map((feature, i) => (
          <div
            key={feature.id}
            data-scroll-reveal="fade-in-up"
            style={
              i > 0
                ? ({ "--reveal-delay": `${i * 100}ms` } as React.CSSProperties)
                : undefined
            }
          >
            <button
              type="button"
              className="w-full cursor-pointer rounded-xl bg-surface-container p-6 text-left transition-shadow hover:shadow-card"
              aria-haspopup="dialog"
              onClick={() => setActiveFeatureId(feature.id)}
            >
              <div
                className={`feature-icon mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${feature.iconBgColor}`}
              >
                <svg
                  className={`h-5 w-5 ${feature.iconColor}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={featureIcons[feature.icon]}
                  />
                  {feature.icon === "settings" && (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  )}
                </svg>
              </div>
              <h3 className="mb-1 font-heading text-lg font-bold text-on-surface">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {feature.description}
              </p>
            </button>
          </div>
        ))}
      </div>

      {activeFeature && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeFeature.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveFeatureId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setActiveFeatureId(null);
          }}
        >
          <div className="mx-4 max-w-lg rounded-2xl border border-border bg-surface p-0 text-on-surface shadow-xl">
            <div className="flex flex-col gap-4 p-6">
              <div className="flex items-start justify-between">
                <h3 className="font-heading text-xl font-bold">
                  {activeFeature.title}
                </h3>
                <button
                  type="button"
                  className="-mr-2 -mt-2 cursor-pointer rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-accent hover:text-on-surface"
                  aria-label={closeLabel}
                  onClick={() => setActiveFeatureId(null)}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-surface-container">
                <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {imagePlaceholder}
                </div>
              </div>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {activeFeature.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
