"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { Paginator } from "./Paginator";

export default function PaginatorDemoInner() {
  return (
    <InkTerminalBox focus rows={16}>
      <Paginator />
    </InkTerminalBox>
  );
}
