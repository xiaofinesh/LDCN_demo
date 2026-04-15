import React from 'react';
import { C } from '../constants/colors';

const Footer: React.FC = () => {
  const tags = ['MILP 全局优化', 'LSTM 负荷预测', 'RL 动态调度', '多平台扩展就绪'];
  return (
    <div
      style={{
        marginTop: 20,
        paddingTop: 14,
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 11, color: C.textMut }}>上海神机智物人工智能科技有限公司</div>
      <div style={{ display: 'flex', gap: 20, fontSize: 10, color: C.textMut }}>
        {tags.map((t) => (
          <span key={t}>
            <span style={{ color: C.accent, marginRight: 4 }}>✓</span>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Footer;
