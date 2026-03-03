"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { Modal } from "./Modal";

export default function ModalDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <Modal />
    </InkTerminalBox>
  );
}
