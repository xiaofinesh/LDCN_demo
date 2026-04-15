# 电池智能调度系统 Demo

上海神机智物为绿地集团演示的移动储能钻井平台电池智能调度系统前端 Demo。

## 技术栈

- Vite 5
- React 18
- TypeScript 5
- 纯内联样式（零 UI 框架）

## 开发

```bash
pnpm install   # 或 npm install
pnpm dev       # 启动开发服务器
pnpm build     # 生产构建
pnpm preview   # 预览构建产物
```

## 项目结构

```
src/
├── main.tsx              # 入口
├── App.tsx               # 主组件
├── constants/            # 颜色 / 电价 / 调度事件 / 日志 / 状态映射
├── hooks/                # useSimulation
├── utils/                # fmt() / simBatteries()
├── components/           # Header / Metric / Map / Gantt / PriceBar / Log / Footer ...
└── types/                # TypeScript 类型定义
```

原单文件源码见 `battery_scheduling_demo.jsx`。
