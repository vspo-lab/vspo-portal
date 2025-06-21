import {
  Activity,
  BarChart3,
  Clock,
  Loader2,
  MessageSquare,
  PieChart,
  TrendingUp,
  Users,
} from "lucide-react";
import type { FC } from "react";
import type { Analytics } from "../types";

interface AnalyticsDashboardProps {
  analytics: Analytics | null;
  isLoading: boolean;
  roomName: string;
}

export const AnalyticsDashboard: FC<AnalyticsDashboardProps> = ({
  analytics,
  isLoading,
  roomName,
}) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">
            Analytics Overview - {roomName}
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Current Viewers</span>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-semibold">{analytics.currentViewers}</p>
            <p className="text-xs text-gray-500 mt-1">
              Peak: {analytics.peakViewers}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-600">Total Viewers</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-semibold">{analytics.totalViewers}</p>
            <p className="text-xs text-blue-500 mt-1">
              {analytics.viewerRetention}% retention
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-600">Avg Watch Time</span>
              <Clock className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-semibold">
              {formatDuration(analytics.averageWatchTime)}
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-600">Chat Messages</span>
              <MessageSquare className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-semibold">{analytics.chatMessages}</p>
            <p className="text-xs text-purple-500 mt-1">
              {Math.round(
                analytics.chatMessages / (analytics.totalViewers || 1),
              )}{" "}
              per viewer
            </p>
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold">Platform Breakdown</h4>
        </div>
        <div className="space-y-3">
          {analytics.platformBreakdown.map((platform) => (
            <div key={platform.platform} className="flex items-center gap-3">
              <span className="text-sm font-medium w-24 capitalize">
                {platform.platform}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
                  style={{ width: `${platform.percentage}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                  {platform.count} ({platform.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Viewer Timeline */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold">Viewer Timeline</h4>
        </div>
        <div className="h-48 flex items-end gap-2">
          {analytics.viewerTimeline.map((point, index) => {
            const height = (point.viewers / analytics.peakViewers) * 100;
            return (
              <div
                key={index}
                className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group"
                style={{ height: `${height}%` }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {point.viewers} viewers
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Start</span>
          <span>Now</span>
        </div>
      </div>

      {/* Popular Moments */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold">Popular Moments</h4>
        </div>
        <div className="space-y-3">
          {analytics.popularMoments.length > 0 ? (
            analytics.popularMoments.map((moment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{moment.video}</p>
                  <p className="text-xs text-gray-500">
                    at {Math.floor(moment.timestamp / 60)}:
                    {(moment.timestamp % 60).toString().padStart(2, "0")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{moment.reactions}</p>
                  <p className="text-xs text-gray-500">reactions</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No popular moments recorded yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
