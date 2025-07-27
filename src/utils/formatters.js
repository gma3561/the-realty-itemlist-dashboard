/**
 * 숫자 금액을 한국 원화 형식으로 포맷팅
 * @param {number} price - 포맷할 금액
 * @param {boolean} includeWon - '원' 단위 포함 여부
 * @returns {string} - 포맷된 금액 문자열
 */
export const formatCurrency = (price, includeWon = true) => {
  if (!price && price !== 0) return '-';
  
  const formatted = new Intl.NumberFormat('ko-KR').format(price);
  return includeWon ? `${formatted}원` : formatted;
};

/**
 * 제곱미터를 평으로 변환
 * @param {number} sqm - 제곱미터 면적
 * @param {boolean} includePyeong - '평' 단위 포함 여부
 * @returns {string} - 변환된 면적 문자열
 */
export const sqmToPyeong = (sqm, includePyeong = true) => {
  if (!sqm && sqm !== 0) return '-';
  
  const pyeong = (sqm * 0.3025).toFixed(2);
  return includePyeong ? `${pyeong}평` : pyeong;
};

/**
 * 날짜를 한국 형식으로 포맷팅
 * @param {string} dateString - 포맷할 날짜 문자열
 * @param {boolean} includeTime - 시간 포함 여부
 * @returns {string} - 포맷된 날짜 문자열
 */
export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    if (includeTime) {
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  } catch (e) {
    console.error('Date formatting error:', e);
    return dateString;
  }
};

/**
 * 문자열이 비어있는지 확인하고 기본값 반환
 * @param {string} value - 확인할 문자열
 * @param {string} defaultValue - 값이 비어있을 때 반환할 기본값
 * @returns {string} - 원래 값 또는 기본값
 */
export const getValueOrDefault = (value, defaultValue = '-') => {
  if (!value || value.trim() === '') return defaultValue;
  return value;
};