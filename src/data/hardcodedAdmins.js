// 환경변수 기반 관리자 목록 (보안 강화)
const getAdminEmailsFromEnv = () => {
  const adminEmails = import.meta.env.VITE_ADMIN_EMAILS;
  if (adminEmails) {
    return adminEmails.split(',').map(email => email.trim());
  }
  
  // 환경변수가 없을 경우 기본 관리자 목록 (개발용)
  console.warn('⚠️ VITE_ADMIN_EMAILS 환경변수가 설정되지 않았습니다. 기본 관리자 목록을 사용합니다.');
  return [
    'jenny@the-realty.co.kr',
    'lucas@the-realty.co.kr', 
    'hmlee@the-realty.co.kr'
  ];
};

// 하드코딩된 관리자 목록 (환경변수 기반)
export const hardcodedAdmins = getAdminEmailsFromEnv().map((email, index) => {
  // 이메일에서 이름 추출 (@ 앞부분)
  const name = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return {
    email,
    name,
    role: 'admin'
  };
});

// 이메일로 관리자 확인
export const isHardcodedAdmin = (email) => {
  if (!email) return false;
  return hardcodedAdmins.some(admin => admin.email.toLowerCase() === email.toLowerCase());
};

// 관리자 정보 가져오기
export const getHardcodedAdmin = (email) => {
  if (!email) return null;
  return hardcodedAdmins.find(admin => admin.email.toLowerCase() === email.toLowerCase());
};