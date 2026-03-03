"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { MultiSelect } from "./MultiSelect";

export default function MultiSelectDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <MultiSelect />
    </InkTerminalBox>
  );
}
