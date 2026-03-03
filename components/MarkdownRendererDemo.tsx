"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./MarkdownRendererDemoInner"),
  { ssr: false }
);

export function MarkdownRendererDemo() {
  return <Inner />;
}
