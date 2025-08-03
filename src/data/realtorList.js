// 더부동산 직원 목록
export const realtorList = [
  // 관리자 (Admin)
  { id: 1, name: '김규민', email: 'gyum@the-realty.co.kr', role: 'admin' },
  { id: 2, name: '하상현', email: 'lucas@the-realty.co.kr', role: 'admin' },
  { id: 6, name: '정연서', email: 'jenny@the-realty.co.kr', role: 'admin' },
  
  // 일반 직원 (User)
  { id: 3, name: '정서연', email: 'yool@the-realty.co.kr', role: 'user' },
  { id: 4, name: '정선혜', email: 'grace@the-realty.co.kr', role: 'user' },
  { id: 5, name: '박소현', email: 'sso@the-realty.co.kr', role: 'user' },
  { id: 7, name: '송영주', email: 'joo@the-realty.co.kr', role: 'user' },
  { id: 8, name: '정윤식', email: 'yun@the-realty.co.kr', role: 'user' },
  { id: 9, name: '성은미', email: 'mimi@the-realty.co.kr', role: 'user' },
  { id: 10, name: '서을선', email: 'sun@the-realty.co.kr', role: 'user' },
  { id: 11, name: '서지혜', email: 'kylie@the-realty.co.kr', role: 'user' },
  { id: 12, name: '이혜만', email: 'hmlee@the-realty.co.kr', role: 'user' },
  { id: 13, name: '김효석', email: 'seok@the-realty.co.kr', role: 'user' }
];

// 관리자 목록만 추출
export const adminList = realtorList.filter(r => r.role === 'admin');

// 이메일로 직원 정보 찾기
export const getRealtorByEmail = (email) => {
  if (!email) return null;
  return realtorList.find(r => r.email.toLowerCase() === email.toLowerCase());
};

// 이름으로 직원 정보 찾기  
export const getRealtorByName = (name) => {
  if (!name) return null;
  return realtorList.find(r => r.name === name);
};

// 관리자인지 확인
export const isAdmin = (email) => {
  const realtor = getRealtorByEmail(email);
  return realtor?.role === 'admin';
};

// 이메일에서 표시 이름 가져오기 (영문 대문자로)
export const getDisplayNameFromEmail = (email) => {
  const realtor = getRealtorByEmail(email);
  if (realtor) return realtor.name;
  
  // 이메일에서 이름 추출 (fallback)
  const nameFromEmail = email.split('@')[0].toUpperCase();
  // hardcoded-prefix 제거
  return nameFromEmail.replace('HARDCODED-', '');
};