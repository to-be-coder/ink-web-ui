"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./CitationBlockDemoInner"), { ssr: false });
export function NewAICitationBlockDemo() {
  return <Inner />;
}
