"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ModelSelectorDemoInner"), { ssr: false });
export function AIModelSelectorDemo() {
  return <Inner />;
}
