const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

// 정적 파일 서빙
app.use(express.static('.'));

// 루트 경로
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>팀 매물장 테스트</title>
      <style>
        body { font-family: sans-serif; padding: 40px; }
        .link { display: block; margin: 20px 0; font-size: 18px; }
      </style>
    </head>
    <body>
      <h1>팀 매물장 테스트 서버</h1>
      <p>서버가 정상적으로 실행 중입니다!</p>
      <a class="link" href="/qa-log-monitor.html">🔍 QA 로그 모니터 열기</a>
      <a class="link" href="/index.html?qa=true">📱 메인 앱 열기 (QA 모드)</a>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`테스트 서버가 http://localhost:${port} 에서 실행 중입니다`);
});