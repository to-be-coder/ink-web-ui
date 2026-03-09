"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./CodeBlockDemoInner"), { ssr: false });
export function AICodeBlockDemo() {
  return <Inner />;
}
