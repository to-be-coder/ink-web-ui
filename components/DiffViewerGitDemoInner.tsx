"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { DiffViewerGit } from "./DiffViewerGit";

export default function DiffViewerGitDemoInner() {
  return (
    <InkTerminalBox focus rows={30}>
      <DiffViewerGit />
    </InkTerminalBox>
  );
}
