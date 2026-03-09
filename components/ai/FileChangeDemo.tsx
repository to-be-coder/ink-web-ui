"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./FileChangeDemoInner"), { ssr: false });
export function AIFileChangeDemo() {
  return <Inner />;
}
