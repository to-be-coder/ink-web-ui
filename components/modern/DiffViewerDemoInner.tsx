"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernDiffViewer } from "./DiffViewer";

export default function ModernDiffViewerDemoInner() {
  return (
    <InkTerminalBox focus rows={40}>
      <ModernDiffViewer />
    </InkTerminalBox>
  );
}
