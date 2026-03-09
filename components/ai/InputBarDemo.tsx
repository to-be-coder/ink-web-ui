"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./InputBarDemoInner"), { ssr: false });
export function AIInputBarDemo() {
  return <Inner />;
}
