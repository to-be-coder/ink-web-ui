"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { StreamingChat } from "./StreamingChat";

export default function StreamingChatDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <StreamingChat />
    </InkTerminalBox>
  );
}
