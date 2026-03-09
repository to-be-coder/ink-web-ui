"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./DataTableDemoInner"), { ssr: false });
export function CleanDataTableDemo() {
  return <Inner />;
}
