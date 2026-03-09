"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ContextWindowDemoInner"), { ssr: false });
export function CleanContextWindowDemo() {
  return <Inner />;
}
