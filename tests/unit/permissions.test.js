import { describe, it, expect } from 'vitest';
import {
  getUserRoleLabel,
  getUserRoleBadgeClass,
  getAuthorizedMenuItems,
  canAccessProperty,
  canViewContactInfo,
  canEditProperty,
  canDeleteProperty
} from '../../src/utils/permissions';

describe('권한 유틸리티 함수 테스트', () => {
  // 테스트용 사용자 데이터
  const adminUser = {
    id: 'admin-123',
    email: 'admin@test.com',
    role: 'admin',
    isAdmin: true,
    name: 'Admin User'
  };

  const regularUser = {
    id: 'user-123',
    email: 'user@test.com',
    role: 'user',
    isAdmin: false,
    name: 'Regular User'
  };

  const nullUser = null;

  const testProperty = {
    id: 'prop-123',
    name: '테스트 매물',
    manager_id: 'user-123',
    owner: '김소유',
    owner_contact: '010-1234-5678'
  };

  describe('getUserRoleLabel', () => {
    it('관리자 사용자의 역할 라벨 반환', () => {
      expect(getUserRoleLabel(adminUser)).toBe('관리자');
    });

    it('일반 사용자의 역할 라벨 반환', () => {
      expect(getUserRoleLabel(regularUser)).toBe('사용자');
    });

    it('null 사용자 처리', () => {
      expect(getUserRoleLabel(nullUser)).toBe('게스트');
    });

    it('role 필드가 없는 사용자 처리', () => {
      const userWithoutRole = { ...regularUser };
      delete userWithoutRole.role;
      
      expect(getUserRoleLabel(userWithoutRole)).toBe('사용자');
    });

    it('알 수 없는 역할 처리', () => {
      const userWithUnknownRole = { ...regularUser, role: 'unknown' };
      expect(getUserRoleLabel(userWithUnknownRole)).toBe('사용자');
    });
  });

  describe('getUserRoleBadgeClass', () => {
    it('관리자 사용자의 배지 클래스 반환', () => {
      const badgeClass = getUserRoleBadgeClass(adminUser);
      expect(badgeClass).toContain('text-red-800');
      expect(badgeClass).toContain('bg-red-100');
      expect(badgeClass).toContain('border-red-200');
    });

    it('일반 사용자의 배지 클래스 반환', () => {
      const badgeClass = getUserRoleBadgeClass(regularUser);
      expect(badgeClass).toContain('text-blue-800');
      expect(badgeClass).toContain('bg-blue-100');
      expect(badgeClass).toContain('border-blue-200');
    });

    it('null 사용자의 배지 클래스 반환', () => {
      const badgeClass = getUserRoleBadgeClass(nullUser);
      expect(badgeClass).toContain('text-gray-800');
      expect(badgeClass).toContain('bg-gray-100');
      expect(badgeClass).toContain('border-gray-200');
    });
  });

  describe('getAuthorizedMenuItems', () => {
    it('관리자는 모든 메뉴 항목 접근 가능', () => {
      const menuItems = getAuthorizedMenuItems(adminUser);
      
      // 관리자 전용 메뉴가 포함되어야 함
      const userManagementMenu = menuItems.find(item => item.path === '/users');
      const performanceMenu = menuItems.find(item => item.path === '/performance');
      
      expect(userManagementMenu).toBeDefined();
      expect(performanceMenu).toBeDefined();
      
      // 기본 메뉴들도 포함되어야 함
      expect(menuItems.some(item => item.path === '/')).toBeTruthy();
      expect(menuItems.some(item => item.path === '/properties')).toBeTruthy();
    });

    it('일반 사용자는 제한된 메뉴만 접근 가능', () => {
      const menuItems = getAuthorizedMenuItems(regularUser);
      
      // 관리자 전용 메뉴는 포함되지 않아야 함
      const userManagementMenu = menuItems.find(item => item.path === '/users');
      const performanceMenu = menuItems.find(item => item.path === '/performance');
      
      expect(userManagementMenu).toBeUndefined();
      expect(performanceMenu).toBeUndefined();
      
      // 기본 메뉴들은 포함되어야 함
      expect(menuItems.some(item => item.path === '/')).toBeTruthy();
      expect(menuItems.some(item => item.path === '/properties')).toBeTruthy();
      expect(menuItems.some(item => item.path === '/my-properties')).toBeTruthy();
    });

    it('로그인하지 않은 사용자는 빈 배열 반환', () => {
      const menuItems = getAuthorizedMenuItems(nullUser);
      expect(menuItems).toEqual([]);
    });

    it('메뉴 항목 구조 검증', () => {
      const menuItems = getAuthorizedMenuItems(adminUser);
      
      menuItems.forEach(item => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('path');
        expect(item).toHaveProperty('icon');
        expect(typeof item.name).toBe('string');
        expect(typeof item.path).toBe('string');
        expect(item.name.length).toBeGreaterThan(0);
        expect(item.path.startsWith('/')).toBeTruthy();
      });
    });
  });

  describe('canAccessProperty', () => {
    it('관리자는 모든 매물 접근 가능', () => {
      expect(canAccessProperty(adminUser, testProperty)).toBeTruthy();
    });

    it('담당자는 자신의 매물 접근 가능', () => {
      expect(canAccessProperty(regularUser, testProperty)).toBeTruthy();
    });

    it('다른 사용자의 매물은 접근 불가', () => {
      const otherProperty = { ...testProperty, manager_id: 'other-user' };
      expect(canAccessProperty(regularUser, otherProperty)).toBeFalsy();
    });

    it('로그인하지 않은 사용자는 접근 불가', () => {
      expect(canAccessProperty(nullUser, testProperty)).toBeFalsy();
    });

    it('매물 정보가 없으면 접근 불가', () => {
      expect(canAccessProperty(regularUser, null)).toBeFalsy();
      expect(canAccessProperty(regularUser, undefined)).toBeFalsy();
    });

    it('manager_id가 없는 매물은 관리자만 접근 가능', () => {
      const propertyWithoutManager = { ...testProperty };
      delete propertyWithoutManager.manager_id;
      
      expect(canAccessProperty(adminUser, propertyWithoutManager)).toBeTruthy();
      expect(canAccessProperty(regularUser, propertyWithoutManager)).toBeFalsy();
    });
  });

  describe('canViewContactInfo', () => {
    it('관리자는 모든 연락처 정보 조회 가능', () => {
      expect(canViewContactInfo(adminUser, testProperty)).toBeTruthy();
    });

    it('담당자는 자신의 매물 연락처 정보 조회 가능', () => {
      expect(canViewContactInfo(regularUser, testProperty)).toBeTruthy();
    });

    it('다른 사용자의 매물 연락처 정보는 조회 불가', () => {
      const otherProperty = { ...testProperty, manager_id: 'other-user' };
      expect(canViewContactInfo(regularUser, otherProperty)).toBeFalsy();
    });

    it('로그인하지 않은 사용자는 연락처 정보 조회 불가', () => {
      expect(canViewContactInfo(nullUser, testProperty)).toBeFalsy();
    });

    it('매물 정보가 없으면 연락처 정보 조회 불가', () => {
      expect(canViewContactInfo(regularUser, null)).toBeFalsy();
    });
  });

  describe('canEditProperty', () => {
    it('관리자는 모든 매물 편집 가능', () => {
      expect(canEditProperty(adminUser, testProperty)).toBeTruthy();
    });

    it('담당자는 자신의 매물 편집 가능', () => {
      expect(canEditProperty(regularUser, testProperty)).toBeTruthy();
    });

    it('다른 사용자의 매물은 편집 불가', () => {
      const otherProperty = { ...testProperty, manager_id: 'other-user' };
      expect(canEditProperty(regularUser, otherProperty)).toBeFalsy();
    });

    it('로그인하지 않은 사용자는 편집 불가', () => {
      expect(canEditProperty(nullUser, testProperty)).toBeFalsy();
    });

    it('매물 정보가 없으면 편집 불가', () => {
      expect(canEditProperty(regularUser, null)).toBeFalsy();
    });
  });

  describe('canDeleteProperty', () => {
    it('관리자는 모든 매물 삭제 가능', () => {
      expect(canDeleteProperty(adminUser, testProperty)).toBeTruthy();
    });

    it('담당자는 자신의 매물 삭제 가능', () => {
      expect(canDeleteProperty(regularUser, testProperty)).toBeTruthy();
    });

    it('다른 사용자의 매물은 삭제 불가', () => {
      const otherProperty = { ...testProperty, manager_id: 'other-user' };
      expect(canDeleteProperty(regularUser, otherProperty)).toBeFalsy();
    });

    it('로그인하지 않은 사용자는 삭제 불가', () => {
      expect(canDeleteProperty(nullUser, testProperty)).toBeFalsy();
    });

    it('매물 정보가 없으면 삭제 불가', () => {
      expect(canDeleteProperty(regularUser, null)).toBeFalsy();
    });
  });

  describe('경계 조건 테스트', () => {
    it('빈 문자열 사용자 ID 처리', () => {
      const userWithEmptyId = { ...regularUser, id: '' };
      const propertyWithEmptyManager = { ...testProperty, manager_id: '' };
      
      expect(canAccessProperty(userWithEmptyId, propertyWithEmptyManager)).toBeFalsy();
    });

    it('숫자 타입 사용자 ID 처리', () => {
      const userWithNumberId = { ...regularUser, id: 123 };
      const propertyWithNumberManager = { ...testProperty, manager_id: 123 };
      
      expect(canAccessProperty(userWithNumberId, propertyWithNumberManager)).toBeTruthy();
    });

    it('undefined role 필드 처리', () => {
      const userWithUndefinedRole = { 
        id: 'test',
        email: 'test@example.com',
        role: undefined,
        isAdmin: false
      };
      
      expect(getUserRoleLabel(userWithUndefinedRole)).toBe('사용자');
      expect(canAccessProperty(userWithUndefinedRole, testProperty)).toBeFalsy();
    });

    it('빈 객체 사용자 처리', () => {
      const emptyUser = {};
      
      expect(getUserRoleLabel(emptyUser)).toBe('사용자');
      expect(canAccessProperty(emptyUser, testProperty)).toBeFalsy();
    });

    it('빈 객체 매물 처리', () => {
      const emptyProperty = {};
      
      expect(canAccessProperty(regularUser, emptyProperty)).toBeFalsy();
      expect(canViewContactInfo(regularUser, emptyProperty)).toBeFalsy();
    });
  });

  describe('성능 테스트', () => {
    it('많은 메뉴 항목 처리 성능', () => {
      const start = performance.now();
      
      // 여러 번 호출하여 성능 측정
      for (let i = 0; i < 1000; i++) {
        getAuthorizedMenuItems(adminUser);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // 1000번 호출이 100ms 이내에 완료되어야 함
      expect(duration).toBeLessThan(100);
    });

    it('권한 확인 함수 성능', () => {
      const start = performance.now();
      
      // 여러 번 호출하여 성능 측정
      for (let i = 0; i < 10000; i++) {
        canAccessProperty(regularUser, testProperty);
        canViewContactInfo(regularUser, testProperty);
        canEditProperty(regularUser, testProperty);
        canDeleteProperty(regularUser, testProperty);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // 40000번 호출이 100ms 이내에 완료되어야 함
      expect(duration).toBeLessThan(100);
    });
  });
});