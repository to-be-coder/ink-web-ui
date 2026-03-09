"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ColorPicker } from "./ColorPicker";

export default function ColorPickerDemoInner() {
  return (
    <InkTerminalBox focus rows={16}>
      <ColorPicker />
    </InkTerminalBox>
  );
}
