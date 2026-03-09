"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanPaginator } from "./Paginator";

export default function CleanPaginatorDemoInner() {
  return (
    <InkTerminalBox focus rows={14}>
      <CleanPaginator />
    </InkTerminalBox>
  );
}
