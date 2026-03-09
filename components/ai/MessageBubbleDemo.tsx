"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./MessageBubbleDemoInner"), { ssr: false });
export function AIMessageBubbleDemo() {
  return <Inner />;
}
