"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ArtifactViewerDemoInner"), { ssr: false });
export function NewAIArtifactViewerDemo() {
  return <Inner />;
}
