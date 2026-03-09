"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIMessageBubbleV3 } from "./MessageBubbleV3";

export default function AIMessageBubbleV3DemoInner() {
  return (
    <InkTerminalBox focus rows={36}>
      <AIMessageBubbleV3 />
    </InkTerminalBox>
  );
}
