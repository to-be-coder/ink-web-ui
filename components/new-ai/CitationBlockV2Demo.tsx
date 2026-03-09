"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./CitationBlockV2DemoInner"), { ssr: false });
export function NewAICitationBlockV2Demo() {
  return <Inner />;
}
