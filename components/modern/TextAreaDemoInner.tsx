"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernTextArea } from "./TextArea";

export default function ModernTextAreaDemoInner() {
  return (
    <InkTerminalBox focus rows={26}>
      <ModernTextArea />
    </InkTerminalBox>
  );
}
