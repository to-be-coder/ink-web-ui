"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { DiffViewerSplit } from "./DiffViewerSplit";

export default function DiffViewerSplitDemoInner() {
  return (
    <InkTerminalBox focus rows={30}>
      <DiffViewerSplit />
    </InkTerminalBox>
  );
}
