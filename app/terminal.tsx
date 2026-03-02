"use client";

import { InkTerminalBox } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";
import { TaskList } from "../components/TaskList";

export const Terminal = () => (
  <InkTerminalBox focus rows={12}>
    <TaskList />
  </InkTerminalBox>
);

export default Terminal;
