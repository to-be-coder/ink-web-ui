"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./FilePickerDemoInner"),
  { ssr: false }
);

export function FilePickerDemo() {
  return <Inner />;
}
