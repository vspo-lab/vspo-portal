"use client";

import { ChevronRight, Clock, Eye, Heart, Users, Video } from "lucide-react";
import { cn } from "../../utils/cn";
import { LinkPreview } from "../LinkPreview";

export interface RelatedItem {
  id: string;
  type: "playlist" | "clip" | "vtuber" | "watchparty";
  title: string;
  href: string;
  thumbnail?: string;
  metadata?: {
    views?: string;
    likes?: number;
    duration?: string;
    creator?: string;
    date?: string;
    members?: number;
  };
  description?: string;
  isHot?: boolean;
  isNew?: boolean;
}

export interface RelatedContentProps {
  title: string;
  items: RelatedItem[];
  className?: string;
  showPreviews?: boolean;
  maxItems?: number;
  layout?: "grid" | "list";
}

export const RelatedContent = ({
  title,
  items,
  className,
  showPreviews = true,
  maxItems = 6,
  layout = "grid",
}: RelatedContentProps) => {
  const displayItems = items.slice(0, maxItems);

  const getTypeIcon = (type: RelatedItem["type"]) => {
    switch (type) {
      case "playlist":
        return <Video className="w-4 h-4" />;
      case "clip":
        return <Video className="w-4 h-4" />;
      case "vtuber":
        return <Users className="w-4 h-4" />;
      case "watchparty":
        return <Users className="w-4 h-4" />;
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: RelatedItem["type"]) => {
    switch (type) {
      case "playlist":
        return "text-purple-600 bg-purple-50";
      case "clip":
        return "text-blue-600 bg-blue-50";
      case "vtuber":
        return "text-green-600 bg-green-50";
      case "watchparty":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const renderGridLayout = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayItems.map((item) => {
        const content = (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            {item.thumbnail && (
              <div className="relative">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-32 object-cover"
                />
                {(item.isHot || item.isNew) && (
                  <div className="absolute top-2 left-2">
                    {item.isHot && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        🔥 HOT
                      </span>
                    )}
                    {item.isNew && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        ✨ NEW
                      </span>
                    )}
                  </div>
                )}
                {item.metadata?.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                    {item.metadata.duration}
                  </div>
                )}
              </div>
            )}

            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn("p-1 rounded-full", getTypeColor(item.type))}
                >
                  {getTypeIcon(item.type)}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {item.type}
                </span>
              </div>

              <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                {item.title}
              </h3>

              {item.metadata && (
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {item.metadata.views && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.metadata.views}
                    </span>
                  )}
                  {item.metadata.likes && (
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {item.metadata.likes}
                    </span>
                  )}
                  {item.metadata.members && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {item.metadata.members}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );

        if (showPreviews) {
          return (
            <LinkPreview
              key={item.id}
              href={item.href}
              preview={{
                title: item.title,
                description: item.description,
                thumbnail: item.thumbnail,
                metadata: item.metadata,
              }}
            >
              {content}
            </LinkPreview>
          );
        }

        return (
          <a
            key={item.id}
            href={item.href}
            className="block hover:scale-105 transition-transform duration-200"
          >
            {content}
          </a>
        );
      })}
    </div>
  );

  const renderListLayout = () => (
    <div className="space-y-3">
      {displayItems.map((item) => {
        const content = (
          <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-200">
            {item.thumbnail && (
              <div className="relative flex-shrink-0">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-16 h-12 object-cover rounded"
                />
                {item.metadata?.duration && (
                  <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                    {item.metadata.duration}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn("p-1 rounded-full", getTypeColor(item.type))}
                >
                  {getTypeIcon(item.type)}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {item.type}
                </span>
                {(item.isHot || item.isNew) && (
                  <div className="flex gap-1">
                    {item.isHot && (
                      <span className="bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                        HOT
                      </span>
                    )}
                    {item.isNew && (
                      <span className="bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                        NEW
                      </span>
                    )}
                  </div>
                )}
              </div>

              <h3 className="font-medium text-gray-900 line-clamp-1 mb-1">
                {item.title}
              </h3>

              {item.metadata && (
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {item.metadata.views && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.metadata.views}
                    </span>
                  )}
                  {item.metadata.creator && (
                    <span>{item.metadata.creator}</span>
                  )}
                  {item.metadata.date && <span>{item.metadata.date}</span>}
                </div>
              )}
            </div>

            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>
        );

        if (showPreviews) {
          return (
            <LinkPreview
              key={item.id}
              href={item.href}
              preview={{
                title: item.title,
                description: item.description,
                thumbnail: item.thumbnail,
                metadata: item.metadata,
              }}
            >
              {content}
            </LinkPreview>
          );
        }

        return (
          <a key={item.id} href={item.href}>
            {content}
          </a>
        );
      })}
    </div>
  );

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <div className={cn("", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {items.length > maxItems && (
          <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
            すべて見る ({items.length})
          </button>
        )}
      </div>

      {layout === "grid" ? renderGridLayout() : renderListLayout()}
    </div>
  );
};
