"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CodeBlock } from "./CodeBlock";

export default function CodeBlockDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <CodeBlock />
    </InkTerminalBox>
  );
}
