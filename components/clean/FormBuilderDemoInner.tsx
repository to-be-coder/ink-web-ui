"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanFormBuilder } from "./FormBuilder";

export default function CleanFormBuilderDemoInner() {
  return (
    <InkTerminalBox focus rows={24}>
      <CleanFormBuilder />
    </InkTerminalBox>
  );
}
