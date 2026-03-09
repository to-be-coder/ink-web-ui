"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./StopwatchDemoInner"), { ssr: false });
export function CleanStopwatchDemo() {
  return <Inner />;
}
