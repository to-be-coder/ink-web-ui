"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanProgress } from "./Progress";

export default function CleanProgressDemoInner() {
  return (
    <InkTerminalBox focus rows={12}>
      <CleanProgress />
    </InkTerminalBox>
  );
}
