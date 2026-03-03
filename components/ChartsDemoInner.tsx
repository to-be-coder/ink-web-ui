"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { Charts } from "./Charts";

export default function ChartsDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <Charts />
    </InkTerminalBox>
  );
}
