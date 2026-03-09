"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIThinkingIndicator } from "./ThinkingIndicator";

export default function AIThinkingIndicatorDemoInner() {
  return (
    <InkTerminalBox focus rows={20}>
      <AIThinkingIndicator />
    </InkTerminalBox>
  );
}
