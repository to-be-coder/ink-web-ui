"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./StatusBarDemoInner"), { ssr: false });
export function AIStatusBarDemo() {
  return <Inner />;
}
