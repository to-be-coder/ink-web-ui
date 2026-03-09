"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIChatThread } from "./ChatThread";

export default function NewAIChatThreadDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <NewAIChatThread />
    </InkTerminalBox>
  );
}
