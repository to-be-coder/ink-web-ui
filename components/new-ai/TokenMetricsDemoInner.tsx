"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAITokenMetrics } from "./TokenMetrics";

export default function NewAITokenMetricsDemoInner() {
  return (
    <InkTerminalBox focus rows={30}>
      <NewAITokenMetrics />
    </InkTerminalBox>
  );
}
