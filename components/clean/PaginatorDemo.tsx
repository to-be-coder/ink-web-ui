"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./PaginatorDemoInner"), { ssr: false });
export function CleanPaginatorDemo() {
  return <Inner />;
}
