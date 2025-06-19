import { useEffect, useState } from "react";

export const useOnlineUsers = (initialCount = 1247) => {
  const [onlineUsers, setOnlineUsers] = useState(initialCount);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers((prev) => prev + Math.floor(Math.random() * 10) - 5);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return onlineUsers;
};
