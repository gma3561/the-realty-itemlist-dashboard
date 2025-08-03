import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/tailwind.css'

// 전역 오류 처리 - MAIN 브랜치에서 수정됨
window.addEventListener('error', (event) => {
  console.error('전역 JavaScript 오류:', event.error);
  // console.log('현재 브랜치: MAIN');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('처리되지 않은 Promise 거부:', event.reason);
});

// 안전한 렌더링
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('렌더링 실패:', error);
  // 기본 HTML로 fallback
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
      <h1>팀 매물장 로딩 중...</h1>
      <p>잠시만 기다려주세요.</p>
      <p style="color: #666; font-size: 12px;">오류가 지속되면 페이지를 새로고침해주세요.</p>
    </div>
  `;
}
