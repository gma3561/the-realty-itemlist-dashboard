# MCP (Model Context Protocol) 설정 가이드

## 개요
이 가이드는 The Realty Itemlist Dashboard에 MCP (Model Context Protocol)를 통합하는 상세한 설정 방법을 제공합니다.

## MCP란?
MCP는 AI 모델과 애플리케이션 간의 표준화된 통신 프로토콜로, 다음과 같은 기능을 제공합니다:
- 실시간 데이터 접근
- 보안된 API 통신
- 확장 가능한 도구 통합
- 컨텍스트 관리

## 사전 요구사항
- Node.js 18.0 이상
- npm 또는 yarn
- Supabase 프로젝트 설정 완료
- 환경 변수 설정 완료

## 설치 단계

### 1. MCP 관련 패키지 설치
```bash
npm install @modelcontextprotocol/sdk @modelcontextprotocol/server-nodejs
npm install --save-dev @modelcontextprotocol/types
```

### 2. MCP 서버 설정

#### 2.1 MCP 서버 파일 생성
`src/mcp/server.js` 파일을 생성합니다:

```javascript
import { Server } from '@modelcontextprotocol/server-nodejs';
import { createSupabaseClient } from '../lib/supabase.js';

export function createMCPServer() {
  const server = new Server({
    name: 'realty-dashboard-mcp',
    version: '1.0.0',
  });

  // 도구 정의
  server.addTool({
    name: 'get_properties',
    description: '매물 목록 조회',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['available', 'pending', 'sold'] },
        limit: { type: 'number', default: 10 }
      }
    },
    handler: async (params) => {
      const supabase = createSupabaseClient();
      const query = supabase.from('properties').select('*');
      
      if (params.status) {
        query.eq('status', params.status);
      }
      
      if (params.limit) {
        query.limit(params.limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return { properties: data };
    }
  });

  server.addTool({
    name: 'create_property',
    description: '새 매물 생성',
    inputSchema: {
      type: 'object',
      required: ['address', 'price', 'type'],
      properties: {
        address: { type: 'string' },
        price: { type: 'number' },
        type: { type: 'string', enum: ['apartment', 'house', 'villa', 'officetel'] },
        description: { type: 'string' }
      }
    },
    handler: async (params) => {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('properties')
        .insert([params])
        .select()
        .single();
      
      if (error) throw error;
      return { property: data };
    }
  });

  server.addTool({
    name: 'update_property_status',
    description: '매물 상태 업데이트',
    inputSchema: {
      type: 'object',
      required: ['id', 'status'],
      properties: {
        id: { type: 'string' },
        status: { type: 'string', enum: ['available', 'pending', 'sold'] }
      }
    },
    handler: async (params) => {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('properties')
        .update({ status: params.status })
        .eq('id', params.id)
        .select()
        .single();
      
      if (error) throw error;
      return { property: data };
    }
  });

  server.addTool({
    name: 'search_properties',
    description: '매물 검색',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        minPrice: { type: 'number' },
        maxPrice: { type: 'number' },
        type: { type: 'string' }
      }
    },
    handler: async (params) => {
      const supabase = createSupabaseClient();
      let query = supabase.from('properties').select('*');
      
      if (params.query) {
        query = query.or(`address.ilike.%${params.query}%,description.ilike.%${params.query}%`);
      }
      
      if (params.minPrice) {
        query = query.gte('price', params.minPrice);
      }
      
      if (params.maxPrice) {
        query = query.lte('price', params.maxPrice);
      }
      
      if (params.type) {
        query = query.eq('type', params.type);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return { properties: data };
    }
  });

  // 리소스 정의
  server.addResource({
    name: 'property_statistics',
    description: '매물 통계 정보',
    handler: async () => {
      const supabase = createSupabaseClient();
      
      const { data: stats } = await supabase
        .from('properties')
        .select('status, count', { count: 'exact', head: false })
        .group('status');
      
      const { data: typeStats } = await supabase
        .from('properties')
        .select('type, count', { count: 'exact', head: false })
        .group('type');
      
      return {
        byStatus: stats,
        byType: typeStats,
        timestamp: new Date().toISOString()
      };
    }
  });

  return server;
}
```

#### 2.2 MCP 서버 스타트업 파일
`src/mcp/index.js` 파일을 생성합니다:

```javascript
import { StdioServerTransport } from '@modelcontextprotocol/server-nodejs';
import { createMCPServer } from './server.js';

async function main() {
  const server = createMCPServer();
  const transport = new StdioServerTransport();
  
  await server.start(transport);
  
  console.error('MCP Server started successfully');
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
```

### 3. 클라이언트 통합

#### 3.1 MCP 클라이언트 훅 생성
`src/hooks/useMCPClient.js` 파일을 생성합니다:

```javascript
import { useState, useEffect } from 'react';
import { Client } from '@modelcontextprotocol/sdk';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/browser';

export function useMCPClient() {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function connect() {
      try {
        const transport = new WebSocketClientTransport(
          process.env.VITE_MCP_SERVER_URL || 'ws://localhost:3001'
        );
        
        const mcpClient = new Client();
        await mcpClient.connect(transport);
        
        setClient(mcpClient);
        setConnected(true);
      } catch (err) {
        console.error('MCP connection failed:', err);
        setError(err);
        setConnected(false);
      }
    }

    connect();

    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, []);

  const callTool = async (toolName, params) => {
    if (!client || !connected) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await client.callTool(toolName, params);
      return result;
    } catch (err) {
      console.error(`Tool call failed: ${toolName}`, err);
      throw err;
    }
  };

  const getResource = async (resourceName) => {
    if (!client || !connected) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await client.getResource(resourceName);
      return result;
    } catch (err) {
      console.error(`Resource fetch failed: ${resourceName}`, err);
      throw err;
    }
  };

  return {
    client,
    connected,
    error,
    callTool,
    getResource
  };
}
```

#### 3.2 MCP 서비스 레이어
`src/services/mcpService.js` 파일을 생성합니다:

```javascript
import { useMCPClient } from '../hooks/useMCPClient';

export class MCPPropertyService {
  constructor(mcpClient) {
    this.client = mcpClient;
  }

  async getProperties(status = null, limit = 10) {
    return await this.client.callTool('get_properties', { status, limit });
  }

  async createProperty(propertyData) {
    return await this.client.callTool('create_property', propertyData);
  }

  async updatePropertyStatus(id, status) {
    return await this.client.callTool('update_property_status', { id, status });
  }

  async searchProperties(searchParams) {
    return await this.client.callTool('search_properties', searchParams);
  }

  async getStatistics() {
    return await this.client.getResource('property_statistics');
  }
}
```

### 4. 환경 변수 설정

`.env` 파일에 다음 변수를 추가합니다:

```bash
# MCP Server Configuration
VITE_MCP_SERVER_URL=ws://localhost:3001
MCP_SERVER_PORT=3001
```

### 5. package.json 스크립트 추가

```json
{
  "scripts": {
    "mcp:server": "node src/mcp/index.js",
    "mcp:dev": "concurrently \"npm run dev\" \"npm run mcp:server\"",
    "mcp:build": "npm run build && npm run mcp:server"
  }
}
```

`concurrently` 패키지 설치:
```bash
npm install --save-dev concurrently
```

### 6. MCP 설정 파일

#### 6.1 MCP 설정 파일 생성
`mcp.config.js` 파일을 생성합니다:

```javascript
export default {
  server: {
    name: 'realty-dashboard-mcp',
    version: '1.0.0',
    transport: 'stdio', // 또는 'websocket'
    host: 'localhost',
    port: 3001
  },
  tools: {
    enabled: [
      'get_properties',
      'create_property',
      'update_property_status',
      'search_properties'
    ]
  },
  resources: {
    enabled: [
      'property_statistics'
    ],
    cacheTimeout: 60000 // 1분
  },
  security: {
    allowedOrigins: ['http://localhost:5173', 'https://gma3561.github.io'],
    requireAuth: true
  }
};
```

### 7. 보안 설정

#### 7.1 인증 미들웨어
`src/mcp/middleware/auth.js` 파일을 생성합니다:

```javascript
import { createSupabaseClient } from '../../lib/supabase.js';

export async function validateMCPRequest(request) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  const token = authHeader.substring(7);
  const supabase = createSupabaseClient();
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid authentication token');
  }
  
  return user;
}
```

### 8. 통합 예제

#### 8.1 컴포넌트에서 MCP 사용
```javascript
import React, { useState, useEffect } from 'react';
import { useMCPClient } from '../hooks/useMCPClient';
import { MCPPropertyService } from '../services/mcpService';

function PropertyList() {
  const { client, connected, callTool } = useMCPClient();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected) {
      loadProperties();
    }
  }, [connected]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const result = await callTool('get_properties', { 
        status: 'available', 
        limit: 20 
      });
      setProperties(result.properties);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return <div>MCP 서버에 연결 중...</div>;
  }

  if (loading) {
    return <div>매물 목록을 불러오는 중...</div>;
  }

  return (
    <div>
      <h2>매물 목록</h2>
      <ul>
        {properties.map(property => (
          <li key={property.id}>
            {property.address} - {property.price}원
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 트러블슈팅

### 연결 문제
- MCP 서버가 실행 중인지 확인
- 방화벽 설정 확인
- 환경 변수가 올바르게 설정되었는지 확인

### 인증 문제
- Supabase 토큰이 유효한지 확인
- CORS 설정 확인

### 성능 문제
- 리소스 캐싱 활성화
- 배치 요청 사용
- 연결 풀링 구성

## 참고 자료
- [MCP 공식 문서](https://modelcontextprotocol.io)
- [Supabase 문서](https://supabase.com/docs)
- [React Query와 MCP 통합](https://tanstack.com/query/latest)