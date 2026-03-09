"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIModelSelector } from "./ModelSelector";

export default function AIModelSelectorDemoInner() {
  return (
    <InkTerminalBox focus rows={18}>
      <AIModelSelector />
    </InkTerminalBox>
  );
}
