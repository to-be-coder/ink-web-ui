"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernSelect } from "./Select";

export default function ModernSelectDemoInner() {
  return (
    <InkTerminalBox focus rows={24}>
      <ModernSelect />
    </InkTerminalBox>
  );
}
