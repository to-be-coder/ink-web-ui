"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernList } from "./List";

export default function ModernListDemoInner() {
  return (
    <InkTerminalBox focus rows={24}>
      <ModernList />
    </InkTerminalBox>
  );
}
