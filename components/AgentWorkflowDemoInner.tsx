"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AgentWorkflow } from "./AgentWorkflow";

export default function AgentWorkflowDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <AgentWorkflow />
    </InkTerminalBox>
  );
}
