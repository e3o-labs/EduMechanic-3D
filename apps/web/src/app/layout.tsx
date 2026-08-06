import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EduMechanic 3D - AI 3D 메커니즘 탐구 놀이터',
  description: '사진 촬영 ➔ 메커니즘 추론 ➔ 3D 시각화 ➔ 공동 탐구 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-800 h-screen w-screen overflow-hidden flex flex-col antialiased select-none">
        {children}
      </body>
    </html>
  );
}
