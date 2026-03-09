"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanTextInput } from "./TextInput";

export default function CleanTextInputDemoInner() {
  return (
    <InkTerminalBox focus rows={20}>
      <CleanTextInput />
    </InkTerminalBox>
  );
}
