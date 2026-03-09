"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernTaskPipeline2 } from "./TaskPipeline2";

export default function ModernTaskPipeline2DemoInner() {
  return (
    <InkTerminalBox focus rows={22}>
      <ModernTaskPipeline2 />
    </InkTerminalBox>
  );
}
