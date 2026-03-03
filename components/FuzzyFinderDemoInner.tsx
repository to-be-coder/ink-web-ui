"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { FuzzyFinder } from "./FuzzyFinder";

export default function FuzzyFinderDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <FuzzyFinder />
    </InkTerminalBox>
  );
}
