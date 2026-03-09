"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./PermissionPromptDemoInner"), { ssr: false });
export function ModernPermissionPromptDemo() {
  return <Inner />;
}
