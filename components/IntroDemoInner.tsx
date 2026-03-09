"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { Intro } from "./Intro";

export default function IntroDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <Intro />
    </InkTerminalBox>
  );
}
