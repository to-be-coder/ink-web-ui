"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAISuggestionChips } from "./SuggestionChips";

export default function NewAISuggestionChipsDemoInner() {
  return (
    <InkTerminalBox focus rows={24}>
      <NewAISuggestionChips />
    </InkTerminalBox>
  );
}
