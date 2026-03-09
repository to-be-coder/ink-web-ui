"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIConfirmationPrompt } from "./ConfirmationPrompt";

export default function NewAIConfirmationPromptDemoInner() {
  return (
    <InkTerminalBox focus rows={28}>
      <NewAIConfirmationPrompt />
    </InkTerminalBox>
  );
}
