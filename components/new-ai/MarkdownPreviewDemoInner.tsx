"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIMarkdownPreview } from "./MarkdownPreview";

export default function NewAIMarkdownPreviewDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <NewAIMarkdownPreview />
    </InkTerminalBox>
  );
}
