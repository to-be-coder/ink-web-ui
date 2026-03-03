"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { TokenUsage } from "./TokenUsage";

export default function TokenUsageDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <TokenUsage />
    </InkTerminalBox>
  );
}
