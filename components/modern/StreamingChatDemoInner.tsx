"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernStreamingChat } from "./StreamingChat";

export default function ModernStreamingChatDemoInner() {
  return (
    <InkTerminalBox focus rows={40}>
      <ModernStreamingChat />
    </InkTerminalBox>
  );
}
