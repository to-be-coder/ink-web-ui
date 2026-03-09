"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { Space } from "./Space";

export default function SpaceDemoInner() {
  return (
    <InkTerminalBox focus rows={25}>
      <Space />
    </InkTerminalBox>
  );
}
