# manager_history 필드 매핑 수정 완료

## 수정 내용

### 1. 쿼리 필드 변경 (ManagerAssignment.jsx)
```javascript
// 변경 전
assigned_at → changed_at
manager_id → previous_manager_id, new_manager_id
assigned_by → changed_by

// JOIN 추가
previous_manager:previous_manager_id(name)
new_manager:new_manager_id(name)  
changer:changed_by(name)
```

### 2. 추가 수정 필요 부분

테이블 렌더링 부분도 필드명에 맞게 수정이 필요합니다:
- `history.changed_at` (201줄) - 이미 맞음
- `history.previous_manager?.name` (204줄) 
- `history.new_manager?.name` (207줄)
- `history.changer?.name` (210줄)

현재 컴포넌트는 JOIN된 데이터를 기대하므로 추가 수정이 필요합니다.