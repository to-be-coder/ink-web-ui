"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { Splash } from "./Splash";

export default function SplashDemoInner() {
  return (
    <InkTerminalBox focus rows={25}>
      <Splash />
    </InkTerminalBox>
  );
}
