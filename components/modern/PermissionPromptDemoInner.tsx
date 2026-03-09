"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernPermissionPrompt } from "./PermissionPrompt";

export default function ModernPermissionPromptDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <ModernPermissionPrompt />
    </InkTerminalBox>
  );
}
