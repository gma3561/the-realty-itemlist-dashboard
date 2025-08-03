export default {
  server: {
    name: 'realty-dashboard-mcp',
    version: '1.0.0',
    transport: 'stdio', // 'stdio' for Claude Desktop, 'websocket' for browser
    host: 'localhost',
    port: 3001
  },
  tools: {
    enabled: [
      'get_properties',
      'create_property',
      'update_property_status',
      'search_properties',
      'get_property_details',
      'delete_property'
    ]
  },
  resources: {
    enabled: [
      'property_statistics',
      'user_statistics',
      'system_health',
      'recent_changes'
    ],
    cacheTimeout: 60000 // 1분
  },
  security: {
    allowedOrigins: ['http://localhost:5173', 'https://gma3561.github.io'],
    requireAuth: false // 개발 중에는 비활성화
  }
};