"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanPermissionPrompt } from "./PermissionPrompt";

export default function CleanPermissionPromptDemoInner() {
  return (
    <InkTerminalBox focus rows={20}>
      <CleanPermissionPrompt />
    </InkTerminalBox>
  );
}
