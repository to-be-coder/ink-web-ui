"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernPaginator } from "./Paginator";

export default function ModernPaginatorDemoInner() {
  return (
    <InkTerminalBox focus rows={18}>
      <ModernPaginator />
    </InkTerminalBox>
  );
}
