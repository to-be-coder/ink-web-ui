"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { Stopwatch } from "./Stopwatch";

export default function StopwatchDemoInner() {
  return (
    <InkTerminalBox focus rows={26}>
      <Stopwatch />
    </InkTerminalBox>
  );
}
