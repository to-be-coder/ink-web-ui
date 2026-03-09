"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./SuggestionChipsDemoInner"), { ssr: false });
export function NewAISuggestionChipsDemo() {
  return <Inner />;
}
