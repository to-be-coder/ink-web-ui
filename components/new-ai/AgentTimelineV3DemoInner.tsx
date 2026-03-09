"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIAgentTimelineV3 } from "./AgentTimeline";

export default function NewAIAgentTimelineV3DemoInner() {
  return (
    <InkTerminalBox focus rows={28}>
      <NewAIAgentTimelineV3 />
    </InkTerminalBox>
  );
}
