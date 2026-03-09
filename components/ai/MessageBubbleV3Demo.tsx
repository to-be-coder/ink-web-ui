"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./MessageBubbleV3DemoInner"),
  { ssr: false }
);

export function AIMessageBubbleV3Demo() {
  return <Inner />;
}
