import { useEffect, useState } from "react";

export const useOnlineUsers = (initialCount = 1247): number => {
  const [onlineUsers, setOnlineUsers] = useState<number>(initialCount);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(
        (prev: number) => prev + Math.floor(Math.random() * 10) - 5,
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return onlineUsers;
};
