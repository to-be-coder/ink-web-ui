"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernFormBuilder } from "./FormBuilder";

export default function ModernFormBuilderDemoInner() {
  return (
    <InkTerminalBox focus rows={24}>
      <ModernFormBuilder />
    </InkTerminalBox>
  );
}
