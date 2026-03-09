"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./MessageBubbleV2DemoInner"),
  { ssr: false }
);

export function AIMessageBubbleV2Demo() {
  return <Inner />;
}
