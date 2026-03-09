"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ConversationListDemoInner"), { ssr: false });
export function AIConversationListDemo() {
  return <Inner />;
}
