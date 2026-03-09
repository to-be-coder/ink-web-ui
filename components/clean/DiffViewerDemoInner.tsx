"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanDiffViewer } from "./DiffViewer";

export default function CleanDiffViewerDemoInner() {
  return (
    <InkTerminalBox focus rows={24}>
      <CleanDiffViewer />
    </InkTerminalBox>
  );
}
