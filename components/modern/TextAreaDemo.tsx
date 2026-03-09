"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./TextAreaDemoInner"), { ssr: false });
export function ModernTextAreaDemo() {
  return <Inner />;
}
