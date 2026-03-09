"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernToolCall } from "./ToolCall";

export default function ModernToolCallDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <ModernToolCall />
    </InkTerminalBox>
  );
}
