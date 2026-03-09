"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanSelect } from "./Select";

export default function CleanSelectDemoInner() {
  return (
    <InkTerminalBox focus rows={16}>
      <CleanSelect />
    </InkTerminalBox>
  );
}
