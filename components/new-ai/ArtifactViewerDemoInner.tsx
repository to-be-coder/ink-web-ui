"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { NewAIArtifactViewer } from "./ArtifactViewer";

export default function NewAIArtifactViewerDemoInner() {
  return (
    <InkTerminalBox focus rows={30}>
      <NewAIArtifactViewer />
    </InkTerminalBox>
  );
}
