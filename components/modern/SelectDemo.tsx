"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./SelectDemoInner"), { ssr: false });
export function ModernSelectDemo() {
  return <Inner />;
}
