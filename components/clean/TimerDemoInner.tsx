"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanTimer } from "./Timer";

export default function CleanTimerDemoInner() {
  return (
    <InkTerminalBox focus rows={12}>
      <CleanTimer />
    </InkTerminalBox>
  );
}
