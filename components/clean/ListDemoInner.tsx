"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanList } from "./List";

export default function CleanListDemoInner() {
  return (
    <InkTerminalBox focus rows={20}>
      <CleanList />
    </InkTerminalBox>
  );
}
