"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIAgentTimelineV7 } from "./AgentTimeline";

export default function NewAIAgentTimelineV7DemoInner() {
  return (
    <InkTerminalBox focus rows={38}>
      <NewAIAgentTimelineV7 />
    </InkTerminalBox>
  );
}
