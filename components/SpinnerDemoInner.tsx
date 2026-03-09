"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { Spinner } from "./Spinner";

export default function SpinnerDemoInner() {
  return (
    <InkTerminalBox focus rows={20}>
      <Spinner />
    </InkTerminalBox>
  );
}
