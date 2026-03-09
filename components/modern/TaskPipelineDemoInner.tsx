"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernTaskPipeline } from "./TaskPipeline";

export default function ModernTaskPipelineDemoInner() {
  return (
    <InkTerminalBox focus rows={48}>
      <ModernTaskPipeline />
    </InkTerminalBox>

  );
}
