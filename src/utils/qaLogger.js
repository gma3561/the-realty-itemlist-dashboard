// QA 로깅 유틸리티
class QALogger {
  constructor() {
    this.enabled = localStorage.getItem('qa_mode') === 'true' || window.location.search.includes('qa=true');
    this.logStorageKey = 'qa_logs';
    this.logEventKey = 'qa_log_event';
    
    if (this.enabled) {
      console.log('🔍 QA 모드 활성화됨');
      this.initializeInterceptors();
    }
  }

  // 로그 타입별 메서드
  info(message, details = {}) {
    this.log('info', message, details);
  }

  success(message, details = {}) {
    this.log('success', message, details);
  }

  warning(message, details = {}) {
    this.log('warning', message, details);
  }

  error(message, details = {}) {
    this.log('error', message, details);
  }

  // 기본 로그 메서드
  log(type, message, details = {}) {
    if (!this.enabled) return;

    const log = {
      id: Date.now() + Math.random(),
      type,
      message,
      details: {
        ...details,
        // 추가 컨텍스트 정보
        page: window.location.pathname,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
    };

    // localStorage에 저장
    const existingLogs = JSON.parse(localStorage.getItem(this.logStorageKey) || '[]');
    existingLogs.push(log);

    // 최대 1000개 로그 유지
    if (existingLogs.length > 1000) {
      existingLogs.shift();
    }

    localStorage.setItem(this.logStorageKey, JSON.stringify(existingLogs));
    
    // 이벤트 발생 (모니터 페이지에 알림)
    localStorage.setItem(this.logEventKey, JSON.stringify(log));

    // 콘솔에도 출력
    console.log(`[QA ${type.toUpperCase()}]`, message, details);
  }

  // API 요청 인터셉터
  initializeInterceptors() {
    // Fetch API 인터셉터
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options = {}] = args;
      const startTime = performance.now();
      
      this.info(`API 요청: ${options.method || 'GET'} ${url}`, {
        method: options.method || 'GET',
        url: url.toString(),
        headers: options.headers,
        body: options.body
      });

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        
        if (response.ok) {
          this.success(`API 응답: ${response.status} ${url}`, {
            status: response.status,
            duration: `${duration.toFixed(2)}ms`,
            url: url.toString()
          });
        } else {
          this.error(`API 에러: ${response.status} ${url}`, {
            status: response.status,
            statusText: response.statusText,
            duration: `${duration.toFixed(2)}ms`,
            url: url.toString()
          });
        }
        
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.error(`API 요청 실패: ${url}`, {
          error: error.message,
          duration: `${duration.toFixed(2)}ms`,
          url: url.toString()
        });
        throw error;
      }
    };

    // 클릭 이벤트 추적
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, a, [role="button"]');
      if (target) {
        const text = target.textContent?.trim() || target.getAttribute('aria-label') || '(텍스트 없음)';
        this.info(`클릭: ${text}`, {
          element: target.tagName,
          id: target.id,
          className: target.className,
          href: target.href
        });
      }
    });

    // 폼 제출 추적
    document.addEventListener('submit', (e) => {
      const form = e.target;
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      
      this.info(`폼 제출: ${form.id || form.name || '익명 폼'}`, {
        action: form.action,
        method: form.method,
        data: data
      });
    });

    // 페이지 네비게이션 추적
    const pushState = history.pushState;
    history.pushState = function(...args) {
      pushState.apply(history, args);
      qaLogger.info('페이지 이동 (pushState)', {
        url: args[2],
        state: args[0]
      });
    };

    window.addEventListener('popstate', () => {
      this.info('페이지 이동 (popstate)', {
        url: window.location.href
      });
    });

    // 에러 추적
    window.addEventListener('error', (e) => {
      this.error('JavaScript 에러', {
        message: e.message,
        filename: e.filename,
        line: e.lineno,
        column: e.colno,
        stack: e.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (e) => {
      this.error('처리되지 않은 Promise 거부', {
        reason: e.reason,
        promise: e.promise
      });
    });
  }

  // 커스텀 이벤트 로깅
  logUserAction(action, details = {}) {
    this.info(`사용자 액션: ${action}`, details);
  }

  // Supabase 작업 로깅
  logSupabaseOperation(operation, table, details = {}) {
    this.info(`Supabase ${operation}: ${table}`, {
      operation,
      table,
      ...details
    });
  }

  // 성능 측정
  startTimer(label) {
    performance.mark(`${label}-start`);
  }

  endTimer(label) {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const measure = performance.getEntriesByName(label)[0];
    
    this.info(`성능 측정: ${label}`, {
      duration: `${measure.duration.toFixed(2)}ms`
    });
    
    // 정리
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    performance.clearMeasures(label);
  }
}

// 싱글톤 인스턴스
const qaLogger = new QALogger();

export default qaLogger;