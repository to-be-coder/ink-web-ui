"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./TabsDemoInner"), { ssr: false });
export function ModernTabsDemo() {
  return <Inner />;
}
