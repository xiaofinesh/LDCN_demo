# 电池智能调度系统 Demo — Claude Code 项目搭建指令

## 项目目标

将附件中的 `battery_scheduling_demo.jsx` 迁移为一个可本地运行的完整前端项目，用于给甲方（绿地集团）演示电池智能调度系统。

---

## 技术栈

| 类别 | 选择 | 版本 |
|------|------|------|
| 构建工具 | Vite | 5.x |
| 框架 | React | 18.x |
| 语言 | TypeScript | 5.x |
| 样式 | CSS Modules 或内联样式（当前代码为内联样式，保持不变） | — |
| 包管理 | pnpm（或 npm） | — |

不需要额外 UI 库（无 Ant Design、Tailwind 等），当前代码是纯 React + 内联样式，保持这个方式。

---

## 项目结构

```
battery-scheduling-demo/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   └── favicon.svg          # ⚡ 图标
└── src/
    ├── main.tsx              # 入口，挂载 App
    ├── App.tsx               # 主组件（从 battery_scheduling_demo.jsx 迁移）
    ├── constants/
    │   ├── colors.ts         # 颜色常量 C 对象
    │   ├── pricing.ts        # TIERS、SCHED、tier() 函数
    │   ├── schedule.ts       # EVENTS 调度事件数据
    │   └── logs.ts           # LOGS 日志数据
    ├── hooks/
    │   └── useSimulation.ts  # simHour、running、speed 状态 + interval 逻辑
    ├── utils/
    │   ├── format.ts         # fmt() 时间格式化
    │   └── simulation.ts     # simBatteries() 电池状态模拟函数
    ├── components/
    │   ├── Header.tsx         # 顶部标题栏 + 电价标签 + 模拟控制器
    │   ├── MetricRow.tsx      # 指标卡片行
    │   ├── Metric.tsx         # 单个指标卡片
    │   ├── MapView.tsx        # SVG 态势地图
    │   ├── BatteryCards.tsx    # 电池状态卡片列表
    │   ├── BatteryCard.tsx    # 单个电池卡片
    │   ├── PriceBar.tsx       # 分时电价柱状图
    │   ├── Gantt.tsx          # 调度甘特图
    │   ├── LogPanel.tsx       # 调度日志面板
    │   ├── LogLine.tsx        # 单条日志
    │   └── Footer.tsx         # 底部信息栏
    └── types/
        └── index.ts          # Battery、ScheduleEvent、LogEntry 等类型定义
```

---

## 操作步骤

### 1. 初始化项目

```bash
pnpm create vite battery-scheduling-demo --template react-ts
cd battery-scheduling-demo
pnpm install
```

### 2. 迁移代码

将附件 `battery_scheduling_demo.jsx` 的代码按上述结构拆分为 TypeScript 模块。核心逻辑不变，只做以下调整：

- 所有 `export default function App()` 改为标准 React.FC 写法
- 内联样式保持不变（不引入 CSS 框架）
- 为 Battery、ScheduleEvent、LogEntry 等数据结构添加 TypeScript 类型
- SVG 动画保持原样（纯 SVG animate 元素，不依赖任何动画库）

### 3. 关键类型定义（src/types/index.ts）

```typescript
export interface Battery {
  id: number;
  soc: number;
  st: 'supplying' | 'charging' | 'to_station' | 'to_platform' | 'standby' | 'swapping';
  tp: number; // transport progress 0-1
}

export interface ScheduleEvent {
  b: number;    // battery id
  s: number;    // start hour
  e: number;    // end hour
  l: string;    // label
  c: string;    // color
}

export interface LogEntry {
  t: string;    // time "HH:MM"
  m: string;    // message
  k: 'cmd' | 'warn' | 'ok' | 'info' | 'sys';
}

export interface TierInfo {
  c: string;    // color
  p: number;    // price
}
```

### 4. 页面标题

```html
<title>电池智能调度系统 · 上海神机智物</title>
```

### 5. 运行

```bash
pnpm dev
```

---

## 附件

源代码文件：`battery_scheduling_demo.jsx`（在同一项目目录下，Claude Code 直接读取并拆分即可）

---

## 注意事项

- **不要引入额外依赖**，当前代码是纯 React，零外部依赖，保持这个特点
- **不要修改业务逻辑和视觉效果**，只做结构拆分和 TS 类型添加
- **内联样式保留**，不转 CSS Modules 或 Tailwind（后续迭代再考虑）
- 确保 `pnpm dev` 后页面效果与原 jsx artifact 完全一致
