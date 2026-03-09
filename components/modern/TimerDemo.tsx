"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./TimerDemoInner"), { ssr: false });
export function ModernTimerDemo() {
  return <Inner />;
}
