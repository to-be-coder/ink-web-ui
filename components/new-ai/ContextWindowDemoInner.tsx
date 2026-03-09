"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIContextWindow } from "./ContextWindow";

export default function NewAIContextWindowDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <NewAIContextWindow />
    </InkTerminalBox>
  );
}
