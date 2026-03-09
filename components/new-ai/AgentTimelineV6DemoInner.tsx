"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIAgentTimelineV6 } from "./AgentTimeline";

export default function NewAIAgentTimelineV6DemoInner() {
  return (
    <InkTerminalBox focus rows={26}>
      <NewAIAgentTimelineV6 />
    </InkTerminalBox>
  );
}
