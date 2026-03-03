"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { Viewport } from "./Viewport";

export default function ViewportDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <Viewport />
    </InkTerminalBox>
  );
}
