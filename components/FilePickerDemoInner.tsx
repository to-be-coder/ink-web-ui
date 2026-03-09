"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { FilePicker } from "./FilePicker";

export default function FilePickerDemoInner() {
  return (
    <InkTerminalBox focus rows={26}>
      <FilePicker />
    </InkTerminalBox>
  );
}
