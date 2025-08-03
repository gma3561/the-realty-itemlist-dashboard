#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';

// Keychain에서 Supabase 설정 가져오기
import { execSync } from 'child_process';

function getFromKeychain(service, account) {
  try {
    const result = execSync(`security find-generic-password -a "${account}" -s "${service}" -w`, { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    console.error(`❌ Keychain에서 ${service} 키를 찾을 수 없습니다`);
    return null;
  }
}

// Supabase 클라이언트 (Keychain에서 자동 로드)
const supabaseUrl = getFromKeychain('supabase-url', 'supabase') || 'https://qwxghpwasmvottahchky.supabase.co';
const supabaseKey = getFromKeychain('supabase-anon-key', 'supabase') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';

const supabase = createClient(supabaseUrl, supabaseKey);

const server = new Server(
  {
    name: 'realty-dashboard-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_properties',
      description: '매물 목록을 조회합니다',
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['available', 'pending', 'sold'],
            description: '매물 상태 필터',
          },
          limit: {
            type: 'number',
            default: 10,
            description: '조회할 매물 수',
          },
        },
      },
    },
    {
      name: 'search_properties',
      description: '매물을 검색합니다',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '검색어',
          },
          minPrice: {
            type: 'number',
            description: '최소 가격',
          },
          maxPrice: {
            type: 'number',
            description: '최대 가격',
          },
        },
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  console.error(`🔧 Calling tool: ${name}`);
  
  switch (name) {
    case 'get_properties': {
      let query = supabase.from('properties').select('*');
      
      if (args.status) {
        query = query.eq('status', args.status);
      }
      
      const { data, error } = await query.limit(args.limit || 10);
      
      if (error) throw error;
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ properties: data }, null, 2),
          },
        ],
      };
    }
    
    case 'search_properties': {
      let query = supabase.from('properties').select('*');
      
      if (args.query) {
        query = query.or(
          `address.ilike.%${args.query}%,description.ilike.%${args.query}%`
        );
      }
      
      if (args.minPrice) {
        query = query.gte('price', args.minPrice);
      }
      
      if (args.maxPrice) {
        query = query.lte('price', args.maxPrice);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ properties: data }, null, 2),
          },
        ],
      };
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Handle resource listing
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'resource://property_statistics',
      name: 'property_statistics',
      description: '매물 통계 정보를 제공합니다',
      mimeType: 'application/json',
    },
  ],
}));

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  console.error(`📊 Reading resource: ${uri}`);
  
  if (uri === 'resource://property_statistics') {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('status, type, price');
    
    if (error) throw error;
    
    const stats = {
      total: properties.length,
      byStatus: {},
      byType: {},
      avgPrice: 0,
    };
    
    let totalPrice = 0;
    
    properties.forEach((prop) => {
      stats.byStatus[prop.status] = (stats.byStatus[prop.status] || 0) + 1;
      stats.byType[prop.type] = (stats.byType[prop.type] || 0) + 1;
      totalPrice += prop.price || 0;
    });
    
    stats.avgPrice =
      properties.length > 0 ? totalPrice / properties.length : 0;
    
    return {
      contents: [
        {
          uri: uri,
          mimeType: 'application/json',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }
  
  throw new Error(`Unknown resource: ${uri}`);
});

async function main() {
  console.error('🚀 Starting Realty Dashboard MCP Server...');
  
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('✅ MCP server running on stdio');
  } catch (error) {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
}

main();