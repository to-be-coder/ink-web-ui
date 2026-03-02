import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      ink: 'ink-web',
    },
  },
};

const withMDX = createMDX();

export default withMDX(config);
