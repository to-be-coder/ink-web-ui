"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { MarkdownRenderer } from "./MarkdownRenderer";

export default function MarkdownRendererDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <MarkdownRenderer />
    </InkTerminalBox>
  );
}
