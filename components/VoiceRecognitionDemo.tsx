"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./VoiceRecognitionDemoInner"),
  { ssr: false }
);

export function VoiceRecognitionDemo() {
  return <Inner />;
}
