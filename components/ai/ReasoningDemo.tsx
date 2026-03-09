"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ReasoningDemoInner"), { ssr: false });
export function AIReasoningDemo() {
  return <Inner />;
}
