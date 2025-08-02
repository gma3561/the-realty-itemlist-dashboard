// 권한 관리 유틸리티

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

export const PERMISSIONS = {
  // 매물 관련 권한
  VIEW_ALL_PROPERTIES: 'view_all_properties',
  VIEW_OWN_PROPERTIES: 'view_own_properties',
  CREATE_PROPERTY: 'create_property',
  EDIT_ALL_PROPERTIES: 'edit_all_properties',
  EDIT_OWN_PROPERTIES: 'edit_own_properties',
  DELETE_ALL_PROPERTIES: 'delete_all_properties',
  DELETE_OWN_PROPERTIES: 'delete_own_properties',
  
  // 사용자 관리 권한
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  
  // 성과 분석 권한
  VIEW_ALL_PERFORMANCE: 'view_all_performance',
  VIEW_OWN_PERFORMANCE: 'view_own_performance',
  
  // CSV 업로드 권한
  BULK_UPLOAD: 'bulk_upload'
};

// 역할별 권한 매핑
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // 관리자는 모든 권한을 가짐
    PERMISSIONS.VIEW_ALL_PROPERTIES,
    PERMISSIONS.VIEW_OWN_PROPERTIES,
    PERMISSIONS.CREATE_PROPERTY,
    PERMISSIONS.EDIT_ALL_PROPERTIES,
    PERMISSIONS.EDIT_OWN_PROPERTIES,
    PERMISSIONS.DELETE_ALL_PROPERTIES,
    PERMISSIONS.DELETE_OWN_PROPERTIES,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ALL_PERFORMANCE,
    PERMISSIONS.VIEW_OWN_PERFORMANCE,
    PERMISSIONS.BULK_UPLOAD
  ],
  [ROLES.USER]: [
    // 일반 사용자는 제한된 권한만 가짐
    PERMISSIONS.VIEW_OWN_PROPERTIES,
    PERMISSIONS.CREATE_PROPERTY,
    PERMISSIONS.EDIT_OWN_PROPERTIES,
    PERMISSIONS.DELETE_OWN_PROPERTIES,
    PERMISSIONS.VIEW_OWN_PERFORMANCE
  ]
};

/**
 * 사용자가 특정 권한을 가지고 있는지 확인
 * @param {Object} user - 사용자 객체
 * @param {string} permission - 확인할 권한
 * @returns {boolean} 권한 보유 여부
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) {
    return false;
  }
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

/**
 * 관리자인지 확인
 * @param {Object} user - 사용자 객체
 * @returns {boolean} 관리자 여부
 */
export const isAdmin = (user) => {
  return user && (user.role === ROLES.ADMIN || user.isAdmin === true);
};

/**
 * 일반 사용자인지 확인
 * @param {Object} user - 사용자 객체
 * @returns {boolean} 일반 사용자 여부
 */
export const isRegularUser = (user) => {
  return user && user.role === ROLES.USER && !isAdmin(user);
};

/**
 * 매물에 대한 권한이 있는지 확인
 * @param {Object} user - 사용자 객체
 * @param {Object} property - 매물 객체
 * @param {string} action - 수행할 작업 (view, edit, delete)
 * @returns {boolean} 권한 보유 여부
 */
export const hasPropertyPermission = (user, property, action) => {
  if (!user) return false;
  
  // 관리자는 모든 매물에 대한 모든 권한을 가짐
  if (isAdmin(user)) return true;
  
  // 일반 사용자는 본인 매물에만 권한이 있음
  if (isRegularUser(user)) {
    // 매물이 없는 경우 (새 매물 생성 등)
    if (!property) {
      return action === 'create';
    }
    
    // 본인 매물인지 확인
    const isOwner = 
      property.user_id === user.id ||
      property.manager_id === user.id ||
      property.manager_id === user.email ||
      property.manager_id === `hardcoded-${user.email}`;
    
    return isOwner;
  }
  
  return false;
};

/**
 * 네비게이션 메뉴 아이템 필터링
 * @param {Object} user - 사용자 객체
 * @returns {Array} 허용된 메뉴 아이템들
 */
export const getAuthorizedMenuItems = (user) => {
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/',
      permission: PERMISSIONS.VIEW_OWN_PROPERTIES,
      icon: '📊'
    },
    {
      name: 'My Properties',
      path: '/my-properties', 
      permission: PERMISSIONS.VIEW_OWN_PROPERTIES,
      icon: '🏠'
    }
  ];
  
  // 관리자 전용 메뉴
  if (isAdmin(user)) {
    menuItems.push(
      {
        name: 'All Properties',
        path: '/properties',
        permission: PERMISSIONS.VIEW_ALL_PROPERTIES,
        icon: '🏢'
      },
      {
        name: 'User Management',
        path: '/users',
        permission: PERMISSIONS.MANAGE_USERS,
        icon: '👥'
      },
      {
        name: 'Staff Performance',
        path: '/performance',
        permission: PERMISSIONS.VIEW_ALL_PERFORMANCE,
        icon: '📈'
      },
      {
        name: 'CSV Import',
        path: '/csv-import',
        permission: PERMISSIONS.BULK_UPLOAD,
        icon: '📁'
      }
    );
  }
  
  // 설정은 모든 사용자가 접근 가능
  menuItems.push({
    name: 'Settings',
    path: '/settings',
    permission: null, // 모든 사용자 허용
    icon: '⚙️'
  });
  
  return menuItems.filter(item => 
    !item.permission || hasPermission(user, item.permission)
  );
};

/**
 * 사용자 정보 표시용 레이블 생성
 * @param {Object} user - 사용자 객체
 * @returns {string} 사용자 역할 레이블
 */
export const getUserRoleLabel = (user) => {
  if (isAdmin(user)) {
    return '관리자';
  } else if (isRegularUser(user)) {
    return '일반사용자';
  }
  return '게스트';
};

/**
 * 사용자 정보 표시용 배지 스타일 클래스 반환
 * @param {Object} user - 사용자 객체
 * @returns {string} CSS 클래스
 */
export const getUserRoleBadgeClass = (user) => {
  if (isAdmin(user)) {
    return 'bg-red-100 text-red-800 border-red-200';
  } else if (isRegularUser(user)) {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }
  return 'bg-gray-100 text-gray-800 border-gray-200';
};

export default {
  ROLES,
  PERMISSIONS,
  hasPermission,
  isAdmin,
  isRegularUser,
  hasPropertyPermission,
  getAuthorizedMenuItems,
  getUserRoleLabel,
  getUserRoleBadgeClass
};