"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./MarkdownPreviewDemoInner"), { ssr: false });
export function NewAIMarkdownPreviewDemo() {
  return <Inner />;
}
