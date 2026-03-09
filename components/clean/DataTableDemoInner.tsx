"use client";
import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { CleanDataTable } from "./DataTable";

export default function CleanDataTableDemoInner() {
  return (
    <InkTerminalBox focus rows={18}>
      <CleanDataTable />
    </InkTerminalBox>
  );
}
