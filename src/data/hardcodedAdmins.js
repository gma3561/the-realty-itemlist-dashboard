// 환경변수 기반 관리자 목록 (보안 강화)
import ENV_CONFIG from '../config/env.js';

const getAdminEmailsFromEnv = () => {
  const adminEmails = ENV_CONFIG.ADMIN_EMAILS;
  if (adminEmails) {
    return adminEmails.split(',').map(email => email.trim());
  }
  
  // fallback 관리자 목록
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