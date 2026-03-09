"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIFeedbackBar } from "./FeedbackBar";

export default function NewAIFeedbackBarDemoInner() {
  return (
    <InkTerminalBox focus rows={24}>
      <NewAIFeedbackBar />
    </InkTerminalBox>
  );
}
