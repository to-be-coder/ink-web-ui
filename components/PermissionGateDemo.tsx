"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./PermissionGateDemoInner"),
  { ssr: false }
);

export function PermissionGateDemo() {
  return <Inner />;
}
