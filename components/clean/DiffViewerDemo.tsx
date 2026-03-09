"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./DiffViewerDemoInner"), { ssr: false });
export function CleanDiffViewerDemo() {
  return <Inner />;
}
