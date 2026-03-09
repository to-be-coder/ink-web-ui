"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ToolCallBlockDemoInner"), { ssr: false });
export function AIToolCallBlockDemo() {
  return <Inner />;
}
