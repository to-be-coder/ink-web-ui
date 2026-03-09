"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./SpinnerDemoInner"),
  { ssr: false }
);

export function SpinnerDemo() {
  return <Inner />;
}
