"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIChatThreadV2 } from "./ChatThreadV2";

export default function NewAIChatThreadV2DemoInner() {
  return (
    <InkTerminalBox focus rows={40}>
      <NewAIChatThreadV2 />
    </InkTerminalBox>
  );
}
