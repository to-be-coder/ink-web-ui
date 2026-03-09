"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIMessageBubble } from "./MessageBubble";

export default function AIMessageBubbleDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <AIMessageBubble />
    </InkTerminalBox>
  );
}
