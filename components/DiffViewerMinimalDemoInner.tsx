"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { DiffViewerMinimal } from "./DiffViewerMinimal";

export default function DiffViewerMinimalDemoInner() {
  return (
    <InkTerminalBox focus rows={34}>
      <DiffViewerMinimal />
    </InkTerminalBox>
  );
}
