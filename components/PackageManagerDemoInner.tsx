"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { PackageManager } from "./PackageManager";

export default function PackageManagerDemoInner() {
  return (
    <InkTerminalBox focus rows={20}>
      <PackageManager />
    </InkTerminalBox>
  );
}
