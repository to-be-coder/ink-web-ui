"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIStatusBar } from "./StatusBar";

export default function AIStatusBarDemoInner() {
  return (
    <InkTerminalBox focus rows={16}>
      <AIStatusBar />
    </InkTerminalBox>
  );
}
