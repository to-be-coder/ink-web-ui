"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernTabs } from "./Tabs";

export default function ModernTabsDemoInner() {
  return (
    <InkTerminalBox focus rows={24}>
      <ModernTabs />
    </InkTerminalBox>
  );
}
