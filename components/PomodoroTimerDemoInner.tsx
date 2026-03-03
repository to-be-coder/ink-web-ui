"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { PomodoroTimer } from "./PomodoroTimer";

export default function PomodoroTimerDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <PomodoroTimer />
    </InkTerminalBox>
  );
}
