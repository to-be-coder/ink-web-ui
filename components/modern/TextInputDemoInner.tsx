"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernTextInput } from "./TextInput";

export default function ModernTextInputDemoInner() {
  return (
    <InkTerminalBox focus rows={22}>
      <ModernTextInput />
    </InkTerminalBox>
  );
}
