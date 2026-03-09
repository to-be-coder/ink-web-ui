"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernMultiSelect } from "./MultiSelect";

export default function ModernMultiSelectDemoInner() {
  return (
    <InkTerminalBox focus rows={28}>
      <ModernMultiSelect />
    </InkTerminalBox>
  );
}
