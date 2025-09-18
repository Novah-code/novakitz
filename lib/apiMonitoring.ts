// API 모니터링 및 로깅 시스템
export interface APILog {
  timestamp: Date;
  endpoint: string;
  status: number;
  responseTime: number;
  userId?: string;
  error?: string;
  retryCount?: number;
}

class APIMonitor {
  private logs: APILog[] = [];
  private readonly MAX_LOGS = 1000; // 메모리 사용량 제한

  // API 호출 로깅
  logAPICall(log: APILog) {
    this.logs.push(log);
    
    // 로그 개수 제한
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }

    // 콘솔에 중요한 로그 출력
    if (log.status >= 400) {
      console.error(`[API Error] ${log.endpoint} - ${log.status}: ${log.error}`);
    }

    // 로컬스토리지에 에러 로그 저장 (클라이언트 사이드)
    if (typeof window !== 'undefined' && log.status >= 400) {
      this.saveErrorToStorage(log);
    }
  }

  // 에러 통계 가져오기
  getErrorStats(timeframe: number = 3600000) { // 기본 1시간
    const cutoff = new Date(Date.now() - timeframe);
    const recentLogs = this.logs.filter(log => log.timestamp >= cutoff);
    
    const totalRequests = recentLogs.length;
    const errorLogs = recentLogs.filter(log => log.status >= 400);
    const errorRate = totalRequests > 0 ? (errorLogs.length / totalRequests) * 100 : 0;

    // 상태코드별 통계
    const statusCounts: Record<number, number> = {};
    errorLogs.forEach(log => {
      statusCounts[log.status] = (statusCounts[log.status] || 0) + 1;
    });

    return {
      totalRequests,
      errorCount: errorLogs.length,
      errorRate: Math.round(errorRate * 100) / 100,
      statusCounts,
      averageResponseTime: this.getAverageResponseTime(recentLogs)
    };
  }

  // 응답시간 평균 계산
  private getAverageResponseTime(logs: APILog[]): number {
    if (logs.length === 0) return 0;
    const total = logs.reduce((sum, log) => sum + log.responseTime, 0);
    return Math.round(total / logs.length);
  }

  // 로컬스토리지에 에러 저장 (디버깅용)
  private saveErrorToStorage(log: APILog) {
    try {
      const key = 'api-errors';
      const existing = localStorage.getItem(key);
      const errors = existing ? JSON.parse(existing) : [];
      
      errors.push({
        ...log,
        timestamp: log.timestamp.toISOString()
      });

      // 최근 100개 에러만 저장
      const recentErrors = errors.slice(-100);
      localStorage.setItem(key, JSON.stringify(recentErrors));
    } catch (error) {
      console.error('Failed to save error to storage:', error);
    }
  }

  // 실시간 알림 (에러율이 높을 때)
  checkAlerts() {
    const stats = this.getErrorStats(600000); // 10분간 통계
    
    if (stats.errorRate > 50 && stats.totalRequests > 5) {
      console.warn(`🚨 High error rate detected: ${stats.errorRate}% (${stats.errorCount}/${stats.totalRequests})`);
      
      // 실제 운영에서는 여기에 슬랙, 이메일 등 알림 추가
      this.sendAlert({
        type: 'high_error_rate',
        message: `API error rate is ${stats.errorRate}%`,
        data: stats
      });
    }

    // 503 오류가 연속으로 발생하는 경우
    const recent503s = this.logs
      .slice(-5)
      .filter(log => log.status === 503).length;
    
    if (recent503s >= 3) {
      console.warn('🚨 Multiple 503 errors detected - Gemini API may be overloaded');
      this.sendAlert({
        type: 'api_overload',
        message: 'Gemini API appears to be overloaded',
        data: { consecutive503s: recent503s }
      });
    }
  }

  // 알림 발송 (확장 가능)
  private sendAlert(alert: {
    type: string;
    message: string;
    data: any;
  }) {
    // 현재는 콘솔에만 출력, 나중에 웹훅이나 이메일로 확장 가능
    console.warn('ALERT:', alert);
    
    // 예시: 웹훅으로 슬랙에 알림 (실제 운영 시)
    // fetch('/api/alerts/slack', {
    //   method: 'POST',
    //   body: JSON.stringify(alert)
    // });
  }

  // 대시보드용 데이터 내보내기
  getMonitoringData() {
    return {
      recentStats: this.getErrorStats(),
      hourlyStats: this.getErrorStats(3600000), // 1시간
      dailyStats: this.getErrorStats(86400000), // 24시간
      recentErrors: this.logs.filter(log => log.status >= 400).slice(-10)
    };
  }
}

// 전역 인스턴스
export const apiMonitor = new APIMonitor();

// API 호출 래퍼 함수
export async function monitoredFetch(
  url: string, 
  options: RequestInit = {},
  userId?: string
): Promise<Response> {
  const startTime = Date.now();
  let response: Response;
  let error: string | undefined;

  try {
    response = await fetch(url, options);
    
    // 응답 시간 측정
    const responseTime = Date.now() - startTime;
    
    // 로그 기록
    apiMonitor.logAPICall({
      timestamp: new Date(),
      endpoint: url,
      status: response.status,
      responseTime,
      userId,
      error: response.ok ? undefined : `HTTP ${response.status}`,
      retryCount: options.headers && (options.headers as any)['X-Retry-Count'] 
        ? parseInt((options.headers as any)['X-Retry-Count']) 
        : 0
    });

    // 알림 체크
    apiMonitor.checkAlerts();

    return response;
  } catch (err) {
    const responseTime = Date.now() - startTime;
    error = err instanceof Error ? err.message : 'Unknown error';
    
    apiMonitor.logAPICall({
      timestamp: new Date(),
      endpoint: url,
      status: 0, // 네트워크 에러
      responseTime,
      userId,
      error
    });

    apiMonitor.checkAlerts();
    throw err;
  }
}