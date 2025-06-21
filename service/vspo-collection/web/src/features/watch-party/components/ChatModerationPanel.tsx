import {
  AlertCircle,
  MessageSquare,
  MessageSquareOff,
  Trash2,
} from "lucide-react";
import type { FC } from "react";
import type { ChatMessage } from "../types";

interface ChatModerationPanelProps {
  messages: ChatMessage[];
  onDeleteMessage: (messageId: string) => void;
  isEnabled: boolean;
}

export const ChatModerationPanel: FC<ChatModerationPanelProps> = ({
  messages,
  onDeleteMessage,
  isEnabled,
}) => {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Chat Moderation</h3>
        </div>
        {!isEnabled && (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <AlertCircle className="w-4 h-4" />
            Chat is disabled
          </div>
        )}
      </div>

      {isEnabled ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={`group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 ${
                  message.isDeleted ? "opacity-50" : ""
                }`}
              >
                <img
                  src={message.userAvatar}
                  alt={message.userName}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">
                      {message.userName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p
                    className={`text-sm mt-1 ${
                      message.isDeleted
                        ? "text-gray-400 italic line-through"
                        : "text-gray-700"
                    }`}
                  >
                    {message.isDeleted ? "[Message deleted]" : message.content}
                  </p>
                </div>
                {!message.isDeleted && (
                  <button
                    onClick={() => onDeleteMessage(message.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Chat messages will appear here
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageSquareOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Chat is disabled</p>
          <p className="text-sm text-gray-400 mt-1">
            Enable chat in room settings to allow messaging
          </p>
        </div>
      )}

      {/* Message Stats */}
      {isEnabled && messages.length > 0 && (
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Total messages: {messages.length}
          </span>
          <span className="text-gray-600">
            Deleted: {messages.filter((m) => m.isDeleted).length}
          </span>
        </div>
      )}
    </div>
  );
};
