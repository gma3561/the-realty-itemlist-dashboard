// MCP 기반 매물 서비스
export class MCPPropertyService {
  constructor(mcpClient) {
    this.client = mcpClient;
  }

  // 매물 목록 조회
  async getProperties(options = {}) {
    const { status, limit = 10, offset = 0 } = options;
    
    return await this.client.callTool('get_properties', {
      status,
      limit,
      offset
    });
  }

  // 매물 생성
  async createProperty(propertyData) {
    return await this.client.callTool('create_property', propertyData);
  }

  // 매물 상태 업데이트
  async updatePropertyStatus(id, status, notes) {
    return await this.client.callTool('update_property_status', {
      id,
      status,
      notes
    });
  }

  // 매물 검색
  async searchProperties(searchParams) {
    return await this.client.callTool('search_properties', searchParams);
  }

  // 매물 상세 정보
  async getPropertyDetails(id) {
    return await this.client.callTool('get_property_details', { id });
  }

  // 매물 삭제
  async deleteProperty(id, reason) {
    return await this.client.callTool('delete_property', {
      id,
      reason
    });
  }

  // 통계 정보
  async getStatistics() {
    return await this.client.readResource('resource://property_statistics');
  }

  // 최근 변경사항
  async getRecentChanges() {
    return await this.client.readResource('resource://recent_changes');
  }
}

// React 컴포넌트에서 사용하기 위한 훅
import { useMCP } from '../../context/MCPContext';
import { useMemo } from 'react';

export function useMCPPropertyService() {
  const mcpClient = useMCP();
  
  const service = useMemo(() => {
    if (!mcpClient.connected) return null;
    return new MCPPropertyService(mcpClient);
  }, [mcpClient.connected, mcpClient]);
  
  return service;
}