"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./PermissionPromptDemoInner"), { ssr: false });
export function CleanPermissionPromptDemo() {
  return <Inner />;
}
