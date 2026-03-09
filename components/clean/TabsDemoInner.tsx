"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanTabs } from "./Tabs";

export default function CleanTabsDemoInner() {
  return (
    <InkTerminalBox focus rows={16}>
      <CleanTabs />
    </InkTerminalBox>
  );
}
