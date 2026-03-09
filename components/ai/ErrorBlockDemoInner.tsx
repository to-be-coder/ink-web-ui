"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIErrorBlock } from "./ErrorBlock";

export default function AIErrorBlockDemoInner() {
  return (
    <InkTerminalBox focus rows={20}>
      <AIErrorBlock />
    </InkTerminalBox>
  );
}
