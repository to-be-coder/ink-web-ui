"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { VoiceRecognition } from "./VoiceRecognition";

export default function VoiceRecognitionDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <VoiceRecognition />
    </InkTerminalBox>
  );
}
