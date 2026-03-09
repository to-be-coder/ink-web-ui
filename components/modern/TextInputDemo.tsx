"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./TextInputDemoInner"), { ssr: false });
export function ModernTextInputDemo() {
  return <Inner />;
}
