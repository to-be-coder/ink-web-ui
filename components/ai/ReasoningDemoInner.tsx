"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIReasoning } from "./Reasoning";

export default function AIReasoningDemoInner() {
  return (
    <InkTerminalBox focus rows={22}>
      <AIReasoning />
    </InkTerminalBox>
  );
}
