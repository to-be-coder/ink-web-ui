"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./TaskListDemoInner"),
  { ssr: false }
);

export function TaskListDemo() {
  return <Inner />;
}
