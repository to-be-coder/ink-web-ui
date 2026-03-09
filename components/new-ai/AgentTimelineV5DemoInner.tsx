"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIAgentTimelineV5 } from "./AgentTimeline";

export default function NewAIAgentTimelineV5DemoInner() {
  return (
    <InkTerminalBox focus rows={22}>
      <NewAIAgentTimelineV5 />
    </InkTerminalBox>
  );
}
