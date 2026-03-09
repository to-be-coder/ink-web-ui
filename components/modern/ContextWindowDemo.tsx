"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ContextWindowDemoInner"), { ssr: false });
export function ModernContextWindowDemo() {
  return <Inner />;
}
