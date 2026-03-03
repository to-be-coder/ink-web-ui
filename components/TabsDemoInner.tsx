"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { Tabs } from "./Tabs";

export default function TabsDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <Tabs />
    </InkTerminalBox>
  );
}
