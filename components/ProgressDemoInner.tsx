"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { Progress } from "./Progress";

export default function ProgressDemoInner() {
  return (
    <InkTerminalBox focus rows={20}>
      <Progress />
    </InkTerminalBox>
  );
}
