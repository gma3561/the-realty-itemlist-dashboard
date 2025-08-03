import { useState, useEffect, useCallback } from 'react';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// MCP 클라이언트 훅
export function useMCPClient() {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [capabilities, setCapabilities] = useState(null);

  // 연결 시도
  const connect = useCallback(async () => {
    if (connecting || connected) return;
    
    setConnecting(true);
    setError(null);
    
    try {
      // 개발 환경에서는 WebSocket 사용
      const isDevelopment = window.location.hostname === 'localhost';
      const mcpServerUrl = import.meta.env.VITE_MCP_SERVER_URL || 'ws://localhost:3001';
      
      let transport;
      if (isDevelopment && mcpServerUrl.startsWith('ws')) {
        // WebSocket 트랜스포트
        transport = new WebSocketClientTransport(mcpServerUrl);
      } else {
        // 프로덕션에서는 다른 방식 사용 (HTTP 폴백 등)
        console.warn('MCP WebSocket not available in production');
        setConnecting(false);
        return;
      }
      
      const mcpClient = new Client({
        name: 'realty-dashboard-client',
        version: '1.0.0'
      }, {
        capabilities: {}
      });
      
      // 서버 연결
      await mcpClient.connect(transport);
      
      // 서버 정보 가져오기
      const serverInfo = await mcpClient.getServerInfo();
      console.log('📡 Connected to MCP server:', serverInfo);
      
      // 서버 capabilities 확인
      const caps = {
        tools: serverInfo.capabilities?.tools || false,
        resources: serverInfo.capabilities?.resources || false,
        prompts: serverInfo.capabilities?.prompts || false
      };
      
      setCapabilities(caps);
      setClient(mcpClient);
      setConnected(true);
      
    } catch (err) {
      console.error('MCP connection failed:', err);
      setError(err);
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  }, [connecting, connected]);

  // 연결 해제
  const disconnect = useCallback(async () => {
    if (client && connected) {
      try {
        await client.close();
        setClient(null);
        setConnected(false);
        setCapabilities(null);
      } catch (err) {
        console.error('Error disconnecting MCP client:', err);
      }
    }
  }, [client, connected]);

  // 도구 호출
  const callTool = useCallback(async (toolName, args = {}) => {
    if (!client || !connected) {
      throw new Error('MCP client not connected');
    }

    try {
      console.log(`🔧 Calling tool: ${toolName}`, args);
      const result = await client.callTool(toolName, args);
      console.log(`✅ Tool result:`, result);
      return result;
    } catch (err) {
      console.error(`Tool call failed: ${toolName}`, err);
      throw err;
    }
  }, [client, connected]);

  // 리소스 읽기
  const readResource = useCallback(async (resourceUri) => {
    if (!client || !connected) {
      throw new Error('MCP client not connected');
    }

    try {
      console.log(`📊 Reading resource: ${resourceUri}`);
      const result = await client.readResource(resourceUri);
      
      // JSON 파싱
      if (result.contents?.[0]?.text) {
        try {
          const parsed = JSON.parse(result.contents[0].text);
          return parsed;
        } catch {
          return result.contents[0].text;
        }
      }
      
      return result;
    } catch (err) {
      console.error(`Resource read failed: ${resourceUri}`, err);
      throw err;
    }
  }, [client, connected]);

  // 도구 목록 가져오기
  const listTools = useCallback(async () => {
    if (!client || !connected) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await client.listTools();
      return result.tools || [];
    } catch (err) {
      console.error('Failed to list tools:', err);
      throw err;
    }
  }, [client, connected]);

  // 리소스 목록 가져오기
  const listResources = useCallback(async () => {
    if (!client || !connected) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await client.listResources();
      return result.resources || [];
    } catch (err) {
      console.error('Failed to list resources:', err);
      throw err;
    }
  }, [client, connected]);

  // 자동 연결 시도
  useEffect(() => {
    if (!connected && !connecting) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, []);

  return {
    // 상태
    client,
    connected,
    connecting,
    error,
    capabilities,
    
    // 메서드
    connect,
    disconnect,
    callTool,
    readResource,
    listTools,
    listResources
  };
}