"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { PermissionGate } from "./PermissionGate";

export default function PermissionGateDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <PermissionGate />
    </InkTerminalBox>
  );
}
