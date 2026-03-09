"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernContextWindow } from "./ContextWindow";

export default function ModernContextWindowDemoInner() {
  return (
    <InkTerminalBox focus rows={24}>
      <ModernContextWindow />
    </InkTerminalBox>
  );
}
