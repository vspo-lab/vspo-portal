import { useEffect, useState } from "react";
import type { Sparkle } from "../../common/types/schemas";

export const useSparkleEffect = () => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSparkles((prev) => [
        ...prev.slice(-10),
        {
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 100,
        },
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const addSparkles = (positions: Array<{ x: number; y: number }>) => {
    const newSparkles = positions.map((pos, index) => ({
      id: Date.now() + index,
      x: pos.x,
      y: pos.y,
    }));
    setSparkles((prev) => [...prev, ...newSparkles]);
  };

  return { sparkles, addSparkles };
};
