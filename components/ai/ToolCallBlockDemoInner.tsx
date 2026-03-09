"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIToolCallBlock } from "./ToolCallBlock";

export default function AIToolCallBlockDemoInner() {
  return (
    <InkTerminalBox focus rows={28}>
      <AIToolCallBlock />
    </InkTerminalBox>
  );
}
