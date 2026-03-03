"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CommandPalette } from "./CommandPalette";

export default function CommandPaletteDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <CommandPalette />
    </InkTerminalBox>
  );
}
