"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CodeReview } from "./CodeReview";

export default function CodeReviewDemoInner() {
  return (
    <InkTerminalBox focus rows={38}>
      <CodeReview />
    </InkTerminalBox>
  );
}
