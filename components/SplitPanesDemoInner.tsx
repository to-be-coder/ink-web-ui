"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { SplitPanes } from "./SplitPanes";

export default function SplitPanesDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <SplitPanes />
    </InkTerminalBox>
  );
}
