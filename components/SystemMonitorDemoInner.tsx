"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { SystemMonitor } from "./SystemMonitor";

export default function SystemMonitorDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <SystemMonitor />
    </InkTerminalBox>
  );
}
