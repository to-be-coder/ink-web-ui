"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanTextArea } from "./TextArea";

export default function CleanTextAreaDemoInner() {
  return (
    <InkTerminalBox focus rows={18}>
      <CleanTextArea />
    </InkTerminalBox>
  );
}
