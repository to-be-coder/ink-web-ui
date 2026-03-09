"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIMessageBubbleV5 } from "./MessageBubbleV5";

export default function AIMessageBubbleV5DemoInner() {
  return (
    <InkTerminalBox focus rows={40}>
      <AIMessageBubbleV5 />
    </InkTerminalBox>
  );
}
