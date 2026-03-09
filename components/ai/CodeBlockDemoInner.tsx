"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AICodeBlock } from "./CodeBlock";

export default function AICodeBlockDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <AICodeBlock />
    </InkTerminalBox>
  );
}
