"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanMultiSelect } from "./MultiSelect";

export default function CleanMultiSelectDemoInner() {
  return (
    <InkTerminalBox focus rows={16}>
      <CleanMultiSelect />
    </InkTerminalBox>
  );
}
