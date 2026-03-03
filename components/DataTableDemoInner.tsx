"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { DataTable } from "./DataTable";

export default function DataTableDemoInner() {
  return (
    <InkTerminalBox focus rows={32}>
      <DataTable />
    </InkTerminalBox>
  );
}
