"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernStopwatch } from "./Stopwatch";

export default function ModernStopwatchDemoInner() {
  return (
    <InkTerminalBox focus rows={24}>
      <ModernStopwatch />
    </InkTerminalBox>
  );
}
