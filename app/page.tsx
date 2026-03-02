"use client";

import dynamic from "next/dynamic";

const Terminal = dynamic(() => import("./terminal"), {
  ssr: false,
});

export default function Home() {
  return <Terminal />;
}
