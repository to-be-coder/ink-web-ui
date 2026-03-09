"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModelBenchmark } from "./ModelBenchmark";

export default function ModelBenchmarkDemoInner() {
  return (
    <InkTerminalBox focus rows={28}>
      <ModelBenchmark />
    </InkTerminalBox>
  );
}
