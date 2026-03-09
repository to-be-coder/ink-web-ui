"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ThinkingIndicatorDemoInner"), { ssr: false });
export function AIThinkingIndicatorDemo() {
  return <Inner />;
}
