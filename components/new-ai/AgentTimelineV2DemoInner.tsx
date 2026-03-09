"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIAgentTimelineV2 } from "./AgentTimeline";

export default function NewAIAgentTimelineV2DemoInner() {
  return (
    <InkTerminalBox focus rows={22}>
      <NewAIAgentTimelineV2 />
    </InkTerminalBox>
  );
}
