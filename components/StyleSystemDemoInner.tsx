"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { StyleSystem } from "./StyleSystem";

export default function StyleSystemDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <StyleSystem />
    </InkTerminalBox>
  );
}
