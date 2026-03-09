"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./TabsDemoInner"), { ssr: false });
export function CleanTabsDemo() {
  return <Inner />;
}
