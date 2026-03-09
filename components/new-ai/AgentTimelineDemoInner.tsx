"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIAgentTimeline } from "./AgentTimeline";

export default function NewAIAgentTimelineDemoInner() {
  return (
    <InkTerminalBox focus rows={28}>
      <NewAIAgentTimeline />
    </InkTerminalBox>
  );
}
