"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ChatThreadDemoInner"), { ssr: false });
export function NewAIChatThreadDemo() {
  return <Inner />;
}
