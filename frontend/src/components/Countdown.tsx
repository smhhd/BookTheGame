import { useEffect, useState } from "react";

export function Countdown({ until }: { until: string }) {
  const remaining = () => Math.max(0, Math.floor((new Date(until).getTime() - Date.now()) / 1000));
  const [seconds, setSeconds] = useState(remaining);
  useEffect(() => { const timer = window.setInterval(() => setSeconds(remaining()), 1000); return () => clearInterval(timer); }, [until]);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return <span className={seconds < 60 ? "countdown danger" : "countdown"}>{seconds ? `${minutes.toLocaleString("fa-IR")}:${rest.toString().padStart(2, "0")}` : "منقضی شده"}</span>;
}
