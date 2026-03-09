"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanTaskPipeline } from "./TaskPipeline";

export default function CleanTaskPipelineDemoInner() {
  return (
    <InkTerminalBox focus rows={28}>
      <CleanTaskPipeline />
    </InkTerminalBox>
  );
}
