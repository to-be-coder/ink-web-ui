"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIChatThreadV3 } from "./ChatThreadV3";

export default function NewAIChatThreadV3DemoInner() {
  return (
    <InkTerminalBox focus rows={40}>
      <NewAIChatThreadV3 />
    </InkTerminalBox>
  );
}
