"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAICitationBlock } from "./CitationBlock";

export default function NewAICitationBlockDemoInner() {
  return (
    <InkTerminalBox focus rows={28}>
      <NewAICitationBlock />
    </InkTerminalBox>
  );
}
