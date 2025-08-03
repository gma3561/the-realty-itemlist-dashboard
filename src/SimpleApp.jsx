import React from 'react';

function SimpleApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🏠 팀 매물장 - 간단 테스트</h1>
      <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
        <h2>✅ React 앱이 정상적으로 로드되었습니다!</h2>
        <p>현재 시간: {new Date().toLocaleString('ko-KR')}</p>
        <p>포트: 5174</p>
        <p>상태: 정상 작동</p>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => alert('버튼 클릭 작동!')}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          테스트 버튼
        </button>
      </div>
    </div>
  );
}

export default SimpleApp;