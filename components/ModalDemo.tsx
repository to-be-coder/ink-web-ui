"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./ModalDemoInner"),
  { ssr: false }
);

export function ModalDemo() {
  return <Inner />;
}
