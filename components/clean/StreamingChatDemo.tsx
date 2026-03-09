"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./StreamingChatDemoInner"), { ssr: false });
export function CleanStreamingChatDemo() {
  return <Inner />;
}
