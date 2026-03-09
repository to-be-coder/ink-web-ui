"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanStreamingChat } from "./StreamingChat";

export default function CleanStreamingChatDemoInner() {
  return (
    <InkTerminalBox focus rows={28}>
      <CleanStreamingChat />
    </InkTerminalBox>
  );
}
