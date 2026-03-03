"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { LogViewer } from "./LogViewer";

export default function LogViewerDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <LogViewer />
    </InkTerminalBox>
  );
}
