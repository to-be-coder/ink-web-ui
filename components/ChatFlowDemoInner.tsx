"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ChatFlow } from "./ChatFlow";

export default function ChatFlowDemoInner() {
  return (
    <InkTerminalBox focus rows={42}>
      <ChatFlow />
    </InkTerminalBox>
  );
}
