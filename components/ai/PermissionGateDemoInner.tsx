"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { AIPermissionGate } from "./PermissionGate";

export default function AIPermissionGateDemoInner() {
  return (
    <InkTerminalBox focus rows={24}>
      <AIPermissionGate />
    </InkTerminalBox>
  );
}
