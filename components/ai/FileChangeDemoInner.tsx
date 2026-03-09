"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIFileChange } from "./FileChange";

export default function AIFileChangeDemoInner() {
  return (
    <InkTerminalBox focus rows={18}>
      <AIFileChange />
    </InkTerminalBox>
  );
}
