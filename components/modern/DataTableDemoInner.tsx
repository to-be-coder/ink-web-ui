"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { ModernDataTable } from "./DataTable";

export default function ModernDataTableDemoInner() {
  return (
    <InkTerminalBox focus rows={24}>
      <ModernDataTable />
    </InkTerminalBox>
  );
}
