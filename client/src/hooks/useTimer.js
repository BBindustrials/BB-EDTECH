import { useState, useEffect } from 'react';

export default function useTimer(start = true) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!start) return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [start]);
  return seconds;
}
