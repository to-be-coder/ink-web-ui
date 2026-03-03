"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./LogViewerDemoInner"),
  { ssr: false }
);

export function LogViewerDemo() {
  return <Inner />;
}
