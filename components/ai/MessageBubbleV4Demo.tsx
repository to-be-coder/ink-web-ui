"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./MessageBubbleV4DemoInner"),
  { ssr: false }
);

export function AIMessageBubbleV4Demo() {
  return <Inner />;
}
