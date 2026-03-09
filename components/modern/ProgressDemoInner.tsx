"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernProgress } from "./Progress";

export default function ModernProgressDemoInner() {
  return (
    <InkTerminalBox focus rows={20}>
      <ModernProgress />
    </InkTerminalBox>
  );
}
