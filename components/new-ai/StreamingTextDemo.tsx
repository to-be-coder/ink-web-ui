"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./StreamingTextDemoInner"), { ssr: false });
export function NewAIStreamingTextDemo() {
  return <Inner />;
}
