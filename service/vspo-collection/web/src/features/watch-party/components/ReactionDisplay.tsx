"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useWatchPartySync } from "../contexts/WatchPartySyncContext";
import type { WatchPartyReaction } from "../types";

interface ReactionDisplayProps {
  className?: string;
  position?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
}

const reactionEmojis = {
  heart: "❤️",
  laugh: "😂",
  wow: "😮",
  fire: "🔥",
  clap: "👏",
};

export function ReactionDisplay({ 
  className = "", 
  position = "bottom-right" 
}: ReactionDisplayProps) {
  const { reactions } = useWatchPartySync();
  const [displayReactions, setDisplayReactions] = useState<WatchPartyReaction[]>([]);

  useEffect(() => {
    // Only keep reactions from the last 5 seconds
    const cutoffTime = Date.now() - 5000;
    const recentReactions = reactions.filter(
      r => new Date(r.timestamp).getTime() > cutoffTime
    );
    setDisplayReactions(recentReactions);
  }, [reactions]);

  const getPositionStyles = () => {
    switch (position) {
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      default:
        return "bottom-4 right-4";
    }
  };

  return (
    <div className={`fixed ${getPositionStyles()} ${className} pointer-events-none z-50`}>
      <AnimatePresence>
        {displayReactions.map((reaction, index) => (
          <motion.div
            key={reaction.id}
            initial={{ 
              opacity: 0, 
              scale: 0,
              y: 100,
              x: Math.random() * 40 - 20, // Random horizontal offset
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: -index * 60, // Stack reactions vertically
              transition: {
                type: "spring",
                stiffness: 500,
                damping: 25,
              }
            }}
            exit={{ 
              opacity: 0,
              y: -200,
              transition: { 
                duration: 1,
                ease: "easeOut"
              }
            }}
            className="absolute bottom-0 right-0 flex items-center gap-2"
          >
            {/* Reaction bubble */}
            <motion.div
              className="bg-white rounded-full shadow-lg p-3 flex items-center gap-2"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: 2,
                repeatType: "reverse",
              }}
            >
              <span className="text-2xl">
                {reactionEmojis[reaction.type]}
              </span>
              <span className="text-sm font-medium text-gray-700 pr-1">
                {reaction.userName}
              </span>
            </motion.div>
            
            {/* Floating effect */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              animate={{
                y: [-10, -30, -10],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                ease: "easeInOut",
              }}
            >
              <span className="text-4xl opacity-50">
                {reactionEmojis[reaction.type]}
              </span>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Reaction summary */}
      {displayReactions.length > 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-8 right-0 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm"
        >
          +{displayReactions.length - 3} more reactions
        </motion.div>
      )}
    </div>
  );
}