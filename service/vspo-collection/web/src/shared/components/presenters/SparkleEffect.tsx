import { Sparkles } from "lucide-react";
import type { Sparkle } from "../../../common/types/schemas";

interface SparkleEffectProps {
  sparkles: Sparkle[];
}

export const SparkleEffect = ({ sparkles }: SparkleEffectProps) => {
  return (
    <>
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="fixed pointer-events-none z-20 animate-ping"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animationDuration: "2s",
          }}
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </div>
      ))}
    </>
  );
};
