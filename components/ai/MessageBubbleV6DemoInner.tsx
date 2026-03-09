"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIMessageBubbleV6 } from "./MessageBubbleV6";

export default function AIMessageBubbleV6DemoInner() {
  return (
    <InkTerminalBox focus rows={48}>
      <AIMessageBubbleV6 />
    </InkTerminalBox>
  );
}
