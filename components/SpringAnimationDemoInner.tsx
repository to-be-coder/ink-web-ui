"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { SpringAnimation } from "./SpringAnimation";

export default function SpringAnimationDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <SpringAnimation />
    </InkTerminalBox>
  );
}
