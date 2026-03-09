"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIMessageBubbleV4 } from "./MessageBubbleV4";

export default function AIMessageBubbleV4DemoInner() {
  return (
    <InkTerminalBox focus rows={34}>
      <AIMessageBubbleV4 />
    </InkTerminalBox>
  );
}
