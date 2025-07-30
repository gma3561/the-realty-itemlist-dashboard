// 하드코딩된 관리자 목록
export const hardcodedAdmins = [
  {
    email: 'jenny@the-realty.co.kr',
    name: 'Jenny',
    role: 'admin'
  },
  {
    email: 'lucas@the-realty.co.kr',
    name: 'Lucas',
    role: 'admin'
  },
  {
    email: 'hmlee@the-realty.co.kr',
    name: 'Hyungmin Lee',
    role: 'admin'
  }
];

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