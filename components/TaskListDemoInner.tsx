"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { TaskList } from "./TaskList";

export default function TaskListDemoInner() {
  return (
    <InkTerminalBox focus rows={12}>
      <TaskList />
    </InkTerminalBox>
  );
}
