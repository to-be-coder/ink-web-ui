"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { TextInput } from "./TextInput";

export default function TextInputDemoInner() {
  return (
    <InkTerminalBox focus rows={20}>
      <TextInput />
    </InkTerminalBox>
  );
}
