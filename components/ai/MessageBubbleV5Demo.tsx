"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./MessageBubbleV5DemoInner"),
  { ssr: false }
);

export function AIMessageBubbleV5Demo() {
  return <Inner />;
}
