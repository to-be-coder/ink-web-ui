"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { List } from "./List";

export default function ListDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <List />
    </InkTerminalBox>
  );
}
