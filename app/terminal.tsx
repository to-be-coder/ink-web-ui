"use client";

import { InkXterm, Box, Text } from "ink-web";
import "ink-web/css";
import "xterm/css/xterm.css";

export const Terminal = () => (
  <InkXterm focus>
    <Box flexDirection="column">
      <Text color="green">Hello from Ink!</Text>
    </Box>
  </InkXterm>
);

export default Terminal;
