// 桌面中央手机壳；手机端自适应全屏。复用 guofeng.html 的 .phone 设计

import type { ReactNode } from 'react';

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="phone-shell-root">
      <div className="phone-shell-device">{children}</div>
      <style>{`
        .phone-shell-root {
          min-height: 100vh;
          background: #1a1410;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          font-family: 'PingFang SC','Noto Sans SC','Microsoft YaHei',sans-serif;
        }
        .phone-shell-device {
          width: 390px;
          min-height: 844px;
          height: 844px;
          background: #0e0e10;
          color: #fdfaf2;
          position: relative;
          overflow: hidden;
          border-radius: 44px;
          box-shadow: 0 30px 80px rgba(0,0,0,.55), 0 0 0 10px #222129;
          margin: 24px 0;
        }
        @media (max-width: 480px) {
          .phone-shell-root { background: #0e0e10; }
          .phone-shell-device {
            width: 100vw;
            height: 100dvh;
            min-height: 100dvh;
            border-radius: 0;
            box-shadow: none;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
