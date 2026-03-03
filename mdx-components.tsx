import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { TaskListDemo } from './components/TaskListDemo';
import { SystemMonitorDemo } from './components/SystemMonitorDemo';
import { PomodoroTimerDemo } from './components/PomodoroTimerDemo';
import { VoiceRecognitionDemo } from './components/VoiceRecognitionDemo';
import { AgentWorkflowDemo } from './components/AgentWorkflowDemo';
import { TokenUsageDemo } from './components/TokenUsageDemo';
import { DiffViewerDemo } from './components/DiffViewerDemo';
import { LogViewerDemo } from './components/LogViewerDemo';
import { MarkdownRendererDemo } from './components/MarkdownRendererDemo';
import { TreeViewDemo } from './components/TreeViewDemo';
import { DataTableDemo } from './components/DataTableDemo';
import { ChartsDemo } from './components/ChartsDemo';
import { CommandPaletteDemo } from './components/CommandPaletteDemo';
import { SplitPanesDemo } from './components/SplitPanesDemo';
import { StreamingChatDemo } from './components/StreamingChatDemo';
import { PermissionGateDemo } from './components/PermissionGateDemo';
import { CodeBlockDemo } from './components/CodeBlockDemo';
import { MultiSelectDemo } from './components/MultiSelectDemo';
import { StyleSystemDemo } from './components/StyleSystemDemo';
import { SpringAnimationDemo } from './components/SpringAnimationDemo';
import { FormBuilderDemo } from './components/FormBuilderDemo';
import { HelpBarDemo } from './components/HelpBarDemo';
import { ViewportDemo } from './components/ViewportDemo';
import { ModalDemo } from './components/ModalDemo';
import { TabsDemo } from './components/TabsDemo';
import { FuzzyFinderDemo } from './components/FuzzyFinderDemo';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    TaskListDemo,
    SystemMonitorDemo,
    PomodoroTimerDemo,
    VoiceRecognitionDemo,
    AgentWorkflowDemo,
    TokenUsageDemo,
    DiffViewerDemo,
    LogViewerDemo,
    MarkdownRendererDemo,
    TreeViewDemo,
    DataTableDemo,
    ChartsDemo,
    CommandPaletteDemo,
    SplitPanesDemo,
    StreamingChatDemo,
    PermissionGateDemo,
    CodeBlockDemo,
    MultiSelectDemo,
    StyleSystemDemo,
    SpringAnimationDemo,
    FormBuilderDemo,
    HelpBarDemo,
    ViewportDemo,
    ModalDemo,
    TabsDemo,
    FuzzyFinderDemo,
    ...components,
  };
}
