"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./IntroDemoInner"),
  { ssr: false }
);

export function IntroDemo() {
  return <Inner />;
}
