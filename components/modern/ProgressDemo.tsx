"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ProgressDemoInner"), { ssr: false });
export function ModernProgressDemo() {
  return <Inner />;
}
