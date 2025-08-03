const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9000;

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Simple HTML response
  res.writeHead(200, { 
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.end(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <title>팀 매물장 - 테스트</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .success { background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <h1>🎉 서버 연결 성공!</h1>
        <div class="success">
            <h2>✅ Node.js 서버가 정상적으로 작동합니다</h2>
            <p><strong>포트:</strong> ${PORT}</p>
            <p><strong>시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
            <p><strong>상태:</strong> 정상</p>
        </div>
        
        <h3>📋 다음 단계:</h3>
        <ol>
            <li>✅ 기본 HTTP 서버 작동 확인</li>
            <li>🔄 Vite React 서버 문제 해결</li>
            <li>🏠 팀 매물장 애플리케이션 실행</li>
        </ol>
        
        <button onclick="alert('JavaScript 작동 확인!')">테스트 버튼</button>
    </body>
    </html>
  `);
});

server.listen(PORT, () => {
  console.log(`🚀 Simple server running at http://localhost:${PORT}`);
  console.log(`📅 Started at: ${new Date().toLocaleString('ko-KR')}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});