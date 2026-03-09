"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./CostTrackerDemoInner"), { ssr: false });
export function AICostTrackerDemo() {
  return <Inner />;
}
