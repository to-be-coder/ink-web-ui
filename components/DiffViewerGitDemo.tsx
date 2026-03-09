"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./DiffViewerGitDemoInner"),
  { ssr: false }
);

export function DiffViewerGitDemo() {
  return <Inner />;
}
