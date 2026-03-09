"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ChatThreadV3DemoInner"), { ssr: false });
export function NewAIChatThreadV3Demo() {
  return <Inner />;
}
