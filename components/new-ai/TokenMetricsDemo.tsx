"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./TokenMetricsDemoInner"), { ssr: false });
export function NewAITokenMetricsDemo() {
  return <Inner />;
}
