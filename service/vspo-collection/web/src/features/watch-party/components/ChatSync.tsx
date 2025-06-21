"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../../shared/components/presenters/Button";
import { useWatchPartySync } from "../contexts/WatchPartySyncContext";

interface ChatSyncProps {
  className?: string;
  maxHeight?: string;
}

export function ChatSync({ className = "", maxHeight = "400px" }: ChatSyncProps) {
  const {
    chatMessages,
    sendMessage,
    isHost,
    isModerator,
  } = useWatchPartySync();
  
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim()) return;
    
    sendMessage(newMessage.trim());
    setNewMessage("");
    setIsTyping(false);
    inputRef.current?.focus();
  }, [newMessage, sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    // In a real implementation, this would call a delete method
    console.log("Delete message:", messageId);
  }, []);

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Chat Messages */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-2 space-y-3"
        style={{ maxHeight }}
      >
        <AnimatePresence initial={false}>
          {chatMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex gap-3 group"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {message.userName[0].toUpperCase()}
              </div>
              
              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-900">
                    {message.userName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                  
                  {/* Delete button for moderators */}
                  {isModerator && (
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3 text-red-500 hover:text-red-700" />
                    </button>
                  )}
                </div>
                
                <p className={`text-sm break-words ${
                  message.isDeleted 
                    ? "text-gray-400 italic" 
                    : "text-gray-700"
                }`}>
                  {message.isDeleted ? "[メッセージが削除されました]" : message.content}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
        
        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-gray-500 italic"
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
            <span>誰かが入力中...</span>
          </motion.div>
        )}
      </div>
      
      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              setIsTyping(e.target.value.length > 0);
            }}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Character counter */}
        <div className="mt-1 text-xs text-gray-500 text-right">
          {newMessage.length} / 200
        </div>
      </div>
    </div>
  );
}