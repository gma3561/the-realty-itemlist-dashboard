// 환경변수 기반 관리자 관리
import ENV_CONFIG from '../config/env';

// 환경변수에서 관리자 목록 가져오기
const getAdminEmails = () => {
  const adminEmails = ENV_CONFIG.ADMIN_EMAILS || '';
  return adminEmails.split(',').map(email => email.trim()).filter(Boolean);
};

// 이메일로 관리자 확인
export const isHardcodedAdmin = (email) => {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.some(adminEmail => adminEmail.toLowerCase() === email.toLowerCase());
};

// 관리자 정보 가져오기 (환경변수 기반이므로 이메일만 반환)
export const getHardcodedAdmin = (email) => {
  if (!email) return null;
  const isAdmin = isHardcodedAdmin(email);
  return isAdmin ? { email, role: 'admin' } : null;
};

// 임시 하드코딩 데이터 (마이그레이션 기간 동안만 사용)
// TODO: 데이터베이스 기반으로 완전 전환 후 제거
export const hardcodedAdmins = [];