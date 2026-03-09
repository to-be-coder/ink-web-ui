"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { TextArea } from "./TextArea";

export default function TextAreaDemoInner() {
  return (
    <InkTerminalBox focus rows={26}>
      <TextArea />
    </InkTerminalBox>
  );
}
