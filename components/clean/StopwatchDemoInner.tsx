"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanStopwatch } from "./Stopwatch";

export default function CleanStopwatchDemoInner() {
  return (
    <InkTerminalBox focus rows={14}>
      <CleanStopwatch />
    </InkTerminalBox>
  );
}
