import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { TaskListDemo } from './components/TaskListDemo';
import { SystemMonitorDemo } from './components/SystemMonitorDemo';
import { PomodoroTimerDemo } from './components/PomodoroTimerDemo';
import { AgentWorkflowDemo } from './components/AgentWorkflowDemo';
import { TokenUsageDemo } from './components/TokenUsageDemo';
import { DiffViewerDemo } from './components/DiffViewerDemo';
import { DiffViewerSplitDemo } from './components/DiffViewerSplitDemo';
import { DiffViewerMinimalDemo } from './components/DiffViewerMinimalDemo';
import { DiffViewerGitDemo } from './components/DiffViewerGitDemo';
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
import { IntroDemo } from './components/IntroDemo';
import { SpinnerDemo } from './components/SpinnerDemo';
import { TextInputDemo } from './components/TextInputDemo';
import { TextAreaDemo } from './components/TextAreaDemo';
import { ProgressDemo } from './components/ProgressDemo';
import { PaginatorDemo } from './components/PaginatorDemo';
import { ListDemo } from './components/ListDemo';
import { FilePickerDemo } from './components/FilePickerDemo';
import { TimerDemo } from './components/TimerDemo';
import { StopwatchDemo } from './components/StopwatchDemo';
import { SplashDemo } from './components/SplashDemo';
import { SpaceDemo } from './components/SpaceDemo';
import { PackageManagerDemo } from './components/PackageManagerDemo';
import { ChatFlowDemo } from './components/ChatFlowDemo';
import { CodeReviewDemo } from './components/CodeReviewDemo';
import { ColorPickerDemo } from './components/ColorPickerDemo';
import { ModelBenchmarkDemo } from './components/ModelBenchmarkDemo';
import { ModernFormBuilderDemo } from './components/modern/FormBuilderDemo';
import { ModernTaskPipeline2Demo } from './components/modern/TaskPipeline2Demo';
import { ModernProgressDemo } from './components/modern/ProgressDemo';
import { ModernTextInputDemo } from './components/modern/TextInputDemo';
import { ModernListDemo } from './components/modern/ListDemo';
import { ModernTabsDemo } from './components/modern/TabsDemo';
import { ModernDataTableDemo } from './components/modern/DataTableDemo';
import { ModernTextAreaDemo } from './components/modern/TextAreaDemo';
import { ModernTimerDemo } from './components/modern/TimerDemo';
import { ModernStopwatchDemo } from './components/modern/StopwatchDemo';
import { ModernPaginatorDemo } from './components/modern/PaginatorDemo';
import { ModernSelectDemo } from './components/modern/SelectDemo';
import { ModernMultiSelectDemo } from './components/modern/MultiSelectDemo';
import { ModernToolCallDemo } from './components/modern/ToolCallDemo';
import { ModernStreamingChatDemo } from './components/modern/StreamingChatDemo';
import { ModernContextWindowDemo } from './components/modern/ContextWindowDemo';
import { ModernPermissionPromptDemo } from './components/modern/PermissionPromptDemo';
import { ModernDiffViewerDemo } from './components/modern/DiffViewerDemo';
import { AIMessageBubbleDemo } from './components/ai/MessageBubbleDemo';
import { AIMessageBubbleV2Demo } from './components/ai/MessageBubbleV2Demo';
import { AIMessageBubbleV3Demo } from './components/ai/MessageBubbleV3Demo';
import { AIMessageBubbleV4Demo } from './components/ai/MessageBubbleV4Demo';
import { AIMessageBubbleV5Demo } from './components/ai/MessageBubbleV5Demo';
import { AIMessageBubbleV6Demo } from './components/ai/MessageBubbleV6Demo';
import { AIThinkingIndicatorDemo } from './components/ai/ThinkingIndicatorDemo';
import { AIToolCallBlockDemo } from './components/ai/ToolCallBlockDemo';
import { AICodeBlockDemo } from './components/ai/CodeBlockDemo';
import { AICostTrackerDemo } from './components/ai/CostTrackerDemo';
import { AIModelSelectorDemo } from './components/ai/ModelSelectorDemo';
import { AIConversationListDemo } from './components/ai/ConversationListDemo';
import { AIReasoningDemo } from './components/ai/ReasoningDemo';
import { AIFileChangeDemo } from './components/ai/FileChangeDemo';
import { AIInputBarDemo } from './components/ai/InputBarDemo';
import { AIPermissionGateDemo } from './components/ai/PermissionGateDemo';
import { AIStatusBarDemo } from './components/ai/StatusBarDemo';
import { AIErrorBlockDemo } from './components/ai/ErrorBlockDemo';
import { NewAIChatThreadDemo } from './components/new-ai/ChatThreadDemo';
import { NewAIChatThreadV2Demo } from './components/new-ai/ChatThreadV2Demo';
import { NewAIChatThreadV3Demo } from './components/new-ai/ChatThreadV3Demo';
import { NewAIStreamingTextDemo } from './components/new-ai/StreamingTextDemo';
import { NewAICitationBlockDemo } from './components/new-ai/CitationBlockDemo';
import { NewAICitationBlockV2Demo } from './components/new-ai/CitationBlockV2Demo';
import { NewAIArtifactViewerDemo } from './components/new-ai/ArtifactViewerDemo';
import { NewAIAgentTimelineDemo } from './components/new-ai/AgentTimelineDemo';
import { NewAIAgentTimelineV2Demo } from './components/new-ai/AgentTimelineV2Demo';
import { NewAIAgentTimelineV3Demo } from './components/new-ai/AgentTimelineV3Demo';
import { NewAIAgentTimelineV4Demo } from './components/new-ai/AgentTimelineV4Demo';
import { NewAIAgentTimelineV5Demo } from './components/new-ai/AgentTimelineV5Demo';
import { NewAIAgentTimelineV6Demo } from './components/new-ai/AgentTimelineV6Demo';
import { NewAIAgentTimelineV7Demo } from './components/new-ai/AgentTimelineV7Demo';
import { NewAIMultiAgentFlowV3Demo } from './components/new-ai/MultiAgentFlowV3Demo';
import { NewAISuggestionChipsDemo } from './components/new-ai/SuggestionChipsDemo';
import { NewAIFeedbackBarDemo } from './components/new-ai/FeedbackBarDemo';
import { NewAITokenMetricsDemo } from './components/new-ai/TokenMetricsDemo';
import { NewAIContextWindowDemo } from './components/new-ai/ContextWindowDemo';
import { NewAIConfirmationPromptDemo } from './components/new-ai/ConfirmationPromptDemo';
import { NewAIMarkdownPreviewDemo } from './components/new-ai/MarkdownPreviewDemo';
import { CleanToolCallDemo } from './components/clean/ToolCallDemo';
import { CleanTaskPipelineDemo } from './components/clean/TaskPipelineDemo';
import { CleanProgressDemo } from './components/clean/ProgressDemo';
import { CleanTextInputDemo } from './components/clean/TextInputDemo';
import { CleanTextAreaDemo } from './components/clean/TextAreaDemo';
import { CleanListDemo } from './components/clean/ListDemo';
import { CleanSelectDemo } from './components/clean/SelectDemo';
import { CleanMultiSelectDemo } from './components/clean/MultiSelectDemo';
import { CleanTabsDemo } from './components/clean/TabsDemo';
import { CleanDataTableDemo } from './components/clean/DataTableDemo';
import { CleanTimerDemo } from './components/clean/TimerDemo';
import { CleanStopwatchDemo } from './components/clean/StopwatchDemo';
import { CleanPaginatorDemo } from './components/clean/PaginatorDemo';
import { CleanFormBuilderDemo } from './components/clean/FormBuilderDemo';
import { CleanStreamingChatDemo } from './components/clean/StreamingChatDemo';
import { CleanContextWindowDemo } from './components/clean/ContextWindowDemo';
import { CleanPermissionPromptDemo } from './components/clean/PermissionPromptDemo';
import { CleanDiffViewerDemo } from './components/clean/DiffViewerDemo';
import { ChatFlowCleanDemo } from './components/ChatFlowCleanDemo';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    TaskListDemo,
    SystemMonitorDemo,
    PomodoroTimerDemo,
    AgentWorkflowDemo,
    TokenUsageDemo,
    DiffViewerDemo,
    DiffViewerSplitDemo,
    DiffViewerMinimalDemo,
    DiffViewerGitDemo,
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
    IntroDemo,
    SpinnerDemo,
    TextInputDemo,
    TextAreaDemo,
    ProgressDemo,
    PaginatorDemo,
    ListDemo,
    FilePickerDemo,
    TimerDemo,
    StopwatchDemo,
SplashDemo,
    SpaceDemo,
    PackageManagerDemo,
    ChatFlowDemo,
    CodeReviewDemo,
    ColorPickerDemo,
    ModelBenchmarkDemo,
    ModernFormBuilderDemo,
    ModernTaskPipeline2Demo,
    ModernProgressDemo,
    ModernTextInputDemo,
    ModernListDemo,
    ModernTabsDemo,
    ModernDataTableDemo,
    ModernTextAreaDemo,
    ModernTimerDemo,
    ModernStopwatchDemo,
    ModernPaginatorDemo,
    ModernSelectDemo,
    ModernMultiSelectDemo,
    ModernToolCallDemo,
    ModernStreamingChatDemo,
    ModernContextWindowDemo,
    ModernPermissionPromptDemo,
    ModernDiffViewerDemo,
    AIMessageBubbleDemo,
    AIMessageBubbleV2Demo,
    AIMessageBubbleV3Demo,
    AIMessageBubbleV4Demo,
    AIMessageBubbleV5Demo,
    AIMessageBubbleV6Demo,
    AIThinkingIndicatorDemo,
    AIToolCallBlockDemo,
    AICodeBlockDemo,
    AICostTrackerDemo,
    AIModelSelectorDemo,
    AIConversationListDemo,
    AIReasoningDemo,
    AIFileChangeDemo,
    AIInputBarDemo,
    AIPermissionGateDemo,
    AIStatusBarDemo,
    AIErrorBlockDemo,
    NewAIChatThreadDemo,
    NewAIChatThreadV2Demo,
    NewAIChatThreadV3Demo,
    NewAIStreamingTextDemo,
    NewAICitationBlockDemo,
    NewAICitationBlockV2Demo,
    NewAIArtifactViewerDemo,
    NewAIAgentTimelineDemo,
    NewAIAgentTimelineV2Demo,
    NewAIAgentTimelineV3Demo,
    NewAIAgentTimelineV4Demo,
    NewAIAgentTimelineV5Demo,
    NewAIAgentTimelineV6Demo,
    NewAIAgentTimelineV7Demo,
    NewAIMultiAgentFlowV3Demo,
    NewAISuggestionChipsDemo,
    NewAIFeedbackBarDemo,
    NewAITokenMetricsDemo,
    NewAIContextWindowDemo,
    NewAIConfirmationPromptDemo,
    NewAIMarkdownPreviewDemo,
    CleanToolCallDemo,
    CleanTaskPipelineDemo,
    CleanProgressDemo,
    CleanTextInputDemo,
    CleanTextAreaDemo,
    CleanListDemo,
    CleanSelectDemo,
    CleanMultiSelectDemo,
    CleanTabsDemo,
    CleanDataTableDemo,
    CleanTimerDemo,
    CleanStopwatchDemo,
    CleanPaginatorDemo,
    CleanFormBuilderDemo,
    CleanStreamingChatDemo,
    CleanContextWindowDemo,
    CleanPermissionPromptDemo,
    CleanDiffViewerDemo,
    ChatFlowCleanDemo,
    ...components,
  };
}
