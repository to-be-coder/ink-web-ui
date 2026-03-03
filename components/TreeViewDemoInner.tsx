"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { TreeView } from "./TreeView";

export default function TreeViewDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <TreeView />
    </InkTerminalBox>
  );
}
