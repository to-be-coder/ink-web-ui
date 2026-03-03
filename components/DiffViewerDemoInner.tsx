"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { DiffViewer } from "./DiffViewer";

export default function DiffViewerDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <DiffViewer />
    </InkTerminalBox>
  );
}
