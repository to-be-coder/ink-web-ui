"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAICitationBlockV2 } from "./CitationBlockV2";

export default function NewAICitationBlockV2DemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <NewAICitationBlockV2 />
    </InkTerminalBox>
  );
}
