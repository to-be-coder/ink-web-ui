"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./ColorPickerDemoInner"),
  { ssr: false }
);

export function ColorPickerDemo() {
  return <Inner />;
}
