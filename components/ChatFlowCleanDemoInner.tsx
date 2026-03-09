"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ChatFlowClean } from "./ChatFlowClean";

export default function ChatFlowCleanDemoInner() {
  return (
    <InkTerminalBox focus rows={30}>
      <ChatFlowClean />
    </InkTerminalBox>
  );
}
