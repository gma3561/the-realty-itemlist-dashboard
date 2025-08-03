import React from 'react';
import { useMCP } from '../../context/MCPContext';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export function MCPStatus() {
  const { connected, connecting, error, capabilities } = useMCP();
  
  // 프로덕션 환경에서는 표시하지 않음
  if (window.location.hostname !== 'localhost') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm
        ${connected ? 'bg-green-100 text-green-800' : 
          connecting ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'}
      `}>
        {connecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>MCP 연결 중...</span>
          </>
        ) : connected ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>MCP 연결됨</span>
            {capabilities && (
              <div className="flex gap-1 ml-2">
                {capabilities.tools && (
                  <span className="px-1.5 py-0.5 bg-green-200 text-green-700 rounded text-xs">
                    Tools
                  </span>
                )}
                {capabilities.resources && (
                  <span className="px-1.5 py-0.5 bg-green-200 text-green-700 rounded text-xs">
                    Resources
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>MCP 연결 끊김</span>
          </>
        )}
      </div>
      
      {error && !connecting && (
        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
          {error.message || 'MCP 연결 오류'}
        </div>
      )}
    </div>
  );
}