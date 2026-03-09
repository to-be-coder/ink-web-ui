"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIMultiAgentFlowV3 } from "./MultiAgentFlowV3";

export default function NewAIMultiAgentFlowV3DemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <NewAIMultiAgentFlowV3 />
    </InkTerminalBox>
  );
}
