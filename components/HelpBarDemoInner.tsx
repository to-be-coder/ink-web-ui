"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { HelpBar } from "./HelpBar";

export default function HelpBarDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <HelpBar />
    </InkTerminalBox>
  );
}
