"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ChatThreadV2DemoInner"), { ssr: false });
export function NewAIChatThreadV2Demo() {
  return <Inner />;
}
