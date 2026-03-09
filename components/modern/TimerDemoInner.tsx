"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernTimer } from "./Timer";

export default function ModernTimerDemoInner() {
  return (
    <InkTerminalBox focus rows={20}>
      <ModernTimer />
    </InkTerminalBox>
  );
}
