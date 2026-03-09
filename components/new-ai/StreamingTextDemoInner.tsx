"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIStreamingText } from "./StreamingText";

export default function NewAIStreamingTextDemoInner() {
  return (
    <InkTerminalBox focus rows={36}>
      <NewAIStreamingText />
    </InkTerminalBox>
  );
}
