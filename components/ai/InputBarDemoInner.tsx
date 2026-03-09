"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIInputBar } from "./InputBar";

export default function AIInputBarDemoInner() {
  return (
    <InkTerminalBox focus rows={24}>
      <AIInputBar />
    </InkTerminalBox>
  );
}
