const Langchain: SidebarItem = {
  text: 'LangChain',
  collapsed: false,
  base: '/server/langchain',
  items: [
    { text: '概念总览', link: '/' },
    {
      text: '基础教程',
      collapsed: true,
      items: [
        { text: '基础使用', link: '/base/' },
        { text: '消息系统', link: '/base/messages' },
        { text: '提示词模板', link: '/base/prompt' },
        { text: 'Tools 工具', link: '/base/tools' },
        { text: '结构化输出', link: '/base/structured-output' },
      ],
    },
    {
      text: 'Agent 智能体',
      collapsed: true,
      items: [
        { text: 'Agent 概述', link: '/agent/' },
        { text: '创建 Agent', link: '/agent/create-agent' },
        { text: '上下文与记忆', link: '/agent/memory' },
        { text: '中间件', link: '/agent/middleware' },
        { text: 'RAG 知识库', link: '/agent/rag' },
      ],
    },
    { text: 'LangSmith 平台', link: '/langsmith' },
  ]
}

export default Langchain
