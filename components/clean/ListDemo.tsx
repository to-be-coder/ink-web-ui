"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ListDemoInner"), { ssr: false });
export function CleanListDemo() {
  return <Inner />;
}
