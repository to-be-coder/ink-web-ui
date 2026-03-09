"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ConfirmationPromptDemoInner"), { ssr: false });
export function NewAIConfirmationPromptDemo() {
  return <Inner />;
}
