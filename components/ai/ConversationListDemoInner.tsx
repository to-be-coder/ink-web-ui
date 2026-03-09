"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIConversationList } from "./ConversationList";

export default function AIConversationListDemoInner() {
  return (
    <InkTerminalBox focus rows={22}>
      <AIConversationList />
    </InkTerminalBox>
  );
}
