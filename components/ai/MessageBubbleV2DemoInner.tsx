"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIMessageBubbleV2 } from "./MessageBubbleV2";

export default function AIMessageBubbleV2DemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <AIMessageBubbleV2 />
    </InkTerminalBox>
  );
}
