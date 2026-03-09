"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./FormBuilderDemoInner"), { ssr: false });
export function CleanFormBuilderDemo() {
  return <Inner />;
}
