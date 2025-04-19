// /src/hooks/useCurrentTime.js
import { useState, useEffect } from "react";

const useCurrentTime = (intervalMs = 1000) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return currentTime;
};

export default useCurrentTime;
