"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./PomodoroTimerDemoInner"),
  { ssr: false }
);

export function PomodoroTimerDemo() {
  return <Inner />;
}
