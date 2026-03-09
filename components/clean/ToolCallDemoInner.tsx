"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanToolCall } from "./ToolCall";

export default function CleanToolCallDemoInner() {
  return (
    <InkTerminalBox focus rows={18}>
      <CleanToolCall />
    </InkTerminalBox>
  );
}
