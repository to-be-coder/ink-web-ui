"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { FormBuilder } from "./FormBuilder";

export default function FormBuilderDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <FormBuilder />
    </InkTerminalBox>
  );
}
