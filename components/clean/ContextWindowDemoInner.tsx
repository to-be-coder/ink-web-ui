"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanContextWindow } from "./ContextWindow";

export default function CleanContextWindowDemoInner() {
  return (
    <InkTerminalBox focus rows={18}>
      <CleanContextWindow />
    </InkTerminalBox>
  );
}
