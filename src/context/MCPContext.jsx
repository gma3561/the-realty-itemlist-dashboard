import React, { createContext, useContext, useEffect } from 'react';
import { useMCPClient } from '../hooks/useMCPClient';
import { useToast } from './ToastContext';

const MCPContext = createContext(null);

export function MCPProvider({ children }) {
  const mcpClient = useMCPClient();
  const { addToast } = useToast();
  
  // MCP 연결 상태 알림
  useEffect(() => {
    if (mcpClient.connected) {
      console.log('✅ MCP 서버 연결됨');
      // 개발 환경에서만 토스트 표시
      if (window.location.hostname === 'localhost') {
        addToast('MCP 서버에 연결되었습니다', 'success');
      }
    } else if (mcpClient.error) {
      console.error('❌ MCP 연결 실패:', mcpClient.error);
      // 개발 환경에서만 토스트 표시
      if (window.location.hostname === 'localhost') {
        addToast('MCP 서버 연결 실패', 'error');
      }
    }
  }, [mcpClient.connected, mcpClient.error]);
  
  return (
    <MCPContext.Provider value={mcpClient}>
      {children}
    </MCPContext.Provider>
  );
}

// MCP 훅
export const useMCP = () => {
  const context = useContext(MCPContext);
  if (!context) {
    throw new Error('useMCP must be used within MCPProvider');
  }
  return context;
};

// 편의 훅들
export const useMCPTool = (toolName) => {
  const { callTool, connected } = useMCP();
  
  const executeTool = async (args) => {
    if (!connected) {
      throw new Error('MCP not connected');
    }
    return callTool(toolName, args);
  };
  
  return { executeTool, isReady: connected };
};

export const useMCPResource = (resourceName) => {
  const { readResource, connected } = useMCP();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  const fetchResource = React.useCallback(async () => {
    if (!connected) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await readResource(`resource://${resourceName}`);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [connected, readResource, resourceName]);
  
  React.useEffect(() => {
    if (connected) {
      fetchResource();
    }
  }, [connected, fetchResource]);
  
  return { data, loading, error, refetch: fetchResource };
};