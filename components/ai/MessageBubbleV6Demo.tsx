"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./MessageBubbleV6DemoInner"),
  { ssr: false }
);

export function AIMessageBubbleV6Demo() {
  return <Inner />;
}
