"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIAgentTimelineV4 } from "./AgentTimeline";

export default function NewAIAgentTimelineV4DemoInner() {
  return (
    <InkTerminalBox focus rows={30}>
      <NewAIAgentTimelineV4 />
    </InkTerminalBox>
  );
}
