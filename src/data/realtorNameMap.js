// 직원 이메일-이름 매핑
export const realtorNameMap = {
  'gyum@the-realty.co.kr': '김규민',
  'lucas@the-realty.co.kr': '하상현',
  'yool@the-realty.co.kr': '정서연',
  'grace@the-realty.co.kr': '정선혜',
  'sso@the-realty.co.kr': '박소현',
  'jenny@the-realty.co.kr': '정연서',
  'joo@the-realty.co.kr': '송영주',
  'yun@the-realty.co.kr': '정윤식',
  'mimi@the-realty.co.kr': '성은미',
  'sun@the-realty.co.kr': '서을선',
  'kylie@the-realty.co.kr': '서지혜',
  'hmlee@the-realty.co.kr': '이혜만',
  'seok@the-realty.co.kr': '김효석'
};

// 이메일로 이름 찾기
export const getRealtorNameByEmail = (email) => {
  if (!email) return '미지정';
  
  // hardcoded- 접두사 제거
  const cleanEmail = email.replace('hardcoded-', '');
  
  return realtorNameMap[cleanEmail] || cleanEmail.split('@')[0];
};

// 이름으로 이메일 찾기
export const getRealtorEmailByName = (name) => {
  const entry = Object.entries(realtorNameMap).find(([email, n]) => n === name);
  return entry ? entry[0] : null;
};