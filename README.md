# 电池智能调度系统 Demo

上海神机智物为绿地集团演示的移动储能钻井平台电池智能调度系统。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vite 5 · React 18 · TypeScript 5 · React Router 6 |
| 后端 | Node.js · Express 4 · TypeScript 5 |
| 风格 | 浅色主题 · 内联样式 · 真实地理底图 |

## 开发

### 一键同时启动前后端

```bash
npm install              # 一次性安装前端依赖
npm install --prefix server   # 一次性安装后端依赖
npm run dev:all          # 同时启动 vite (5173) + express (4000)
```

### 分开启动

```bash
npm run dev:server       # 后端 http://127.0.0.1:4000
npm run dev              # 前端 http://127.0.0.1:5173
```

前端通过 vite 代理 `/api` → `http://127.0.0.1:4000`。

### 生产构建

```bash
npm run build            # 前端 → dist/
cd server && npm run build  # 后端 → server/dist/
```

## 项目结构

```
.
├── src/                          # 前端
│   ├── main.tsx · App.tsx
│   ├── api/client.ts             # fetch 封装
│   ├── assets/mapBase64.ts       # 任丘-河间真实地理底图
│   ├── components/Toast.tsx      # 全局 toast
│   ├── constants/tokens.ts       # 浅色设计令牌
│   ├── layouts/AppLayout.tsx     # 顶栏 + 页脚
│   └── pages/                    # 5 个核心页面
│       ├── DashboardPage.tsx     # 主控台
│       ├── BatteryDetailPage.tsx # 电池详情
│       ├── DrillingPlanPage.tsx  # 钻井计划录入
│       ├── AlertsPage.tsx        # 告警中心
│       └── PricingReportPage.tsx # 电价优化分析
└── server/                       # 后端
    ├── package.json · tsconfig.json
    └── src/
        ├── index.ts              # Express 入口（/api 路由挂载）
        ├── state.ts              # 内存状态（电池/告警/计划等）
        └── routes/
            ├── dashboard.ts      # GET /api/dashboard
            ├── batteries.ts      # GET/POST /api/batteries/...
            ├── scheduling.ts     # GET plan + POST manual
            ├── alerts.ts         # GET list/detail · POST actions
            ├── drillingPlans.ts  # CRUD + AI estimate
            ├── reports.ts        # 报表 + PDF/Excel 导出
            ├── map.ts            # 地图图层偏好
            └── uploads.ts        # 文件上传占位
```

## 路由 & 按钮 → API 映射

| 前端按钮 | API |
|---|---|
| **主控台** 卫星/路网/标注 | `POST /api/map/layer` |
| **主控台** 导出报表 | `POST /api/reports/export` |
| **主控台** + 手动调度 | `POST /api/scheduling/manual` |
| **主控台** 查看全部 → | navigate `/alerts` |
| **电池详情** ← 返回 / 电池管理 | navigate |
| **电池详情** 导出数据 | `POST /api/batteries/:id/export` |
| **电池详情** ⚡ 立即换电 | `POST /api/batteries/:id/swap` |
| **电池详情** + 手动调度 | `POST /api/scheduling/manual` |
| **钻井计划** AI 实时预估（debounced） | `POST /api/drilling-plans/estimate` |
| **钻井计划** 取消 | navigate(-1) |
| **钻井计划** 保存草稿 | `POST /api/drilling-plans?status=draft` |
| **钻井计划** ✓ 提交计划 | `POST /api/drilling-plans?status=submitted` |
| **钻井计划** 选择文件 | `POST /api/uploads` |
| **告警中心** 📞 呼叫现场 | `POST /api/alerts/:id/call` |
| **告警中心** 启动应急预案 | `POST /api/alerts/:id/emergency` |
| **告警中心** 执行（处置方案） | `POST /api/alerts/:id/actions/:action` |
| **告警中心** 转派他人 | `POST /api/alerts/:id/transfer` |
| **告警中心** 添加备注 | `POST /api/alerts/:id/note` |
| **告警中心** ✓ 标记为已处置 | `POST /api/alerts/:id/resolve` |
| **告警中心** 导出日志 | `POST /api/alerts/export` |
| **告警中心** ⚙ 告警规则 | `GET  /api/alerts/rules/list` |
| **运营报表** 时间区间切换 | `GET  /api/reports/savings?range=` |
| **运营报表** 📄 导出 PDF | `POST /api/reports/pdf` |

所有按钮点击均通过 `useToast()` 给出成功/失败反馈。

## 备注

- 后端为 demo 内存态，重启即重置；不接 DB
- AI 估算采用可解释的简单公式（钻机基线 × 钻深 × 工时）
- MILP/LSTM/RL 字样属示意，实际逻辑为 mock 响应
- 原 V2.0 mockup 源码留在仓库根目录可参考：
  `main_console_mockup.jsx` / `battery_detail_mockup.jsx` / 其余 3 份
