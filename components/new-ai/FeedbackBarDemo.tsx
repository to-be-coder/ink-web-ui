"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./FeedbackBarDemoInner"), { ssr: false });
export function NewAIFeedbackBarDemo() {
  return <Inner />;
}
