"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ErrorBlockDemoInner"), { ssr: false });
export function AIErrorBlockDemo() {
  return <Inner />;
}
