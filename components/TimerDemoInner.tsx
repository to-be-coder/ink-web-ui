"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { Timer } from "./Timer";

export default function TimerDemoInner() {
  return (
    <InkTerminalBox focus rows={22}>
      <Timer />
    </InkTerminalBox>
  );
}
