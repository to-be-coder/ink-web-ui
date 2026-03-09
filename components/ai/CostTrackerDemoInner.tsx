"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AICostTracker } from "./CostTracker";

export default function AICostTrackerDemoInner() {
  return (
    <InkTerminalBox focus rows={22}>
      <AICostTracker />
    </InkTerminalBox>
  );
}
