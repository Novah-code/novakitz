import { NextRequest, NextResponse } from 'next/server';

// 간단한 메모리 기반 통계 저장소 (실제 운영에서는 데이터베이스 사용)
const stats = {
  totalRequests: 0,
  totalErrors: 0,
  errorsByStatus: {} as Record<number, number>,
  hourlyRequests: [] as Array<{ timestamp: number; count: number; errors: number }>,
  lastErrors: [] as Array<{
    timestamp: number;
    status: number;
    error: string;
    responseTime: number;
  }>
};

export async function GET() {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  // 1시간 이내의 통계만 반환
  const recentHourlyData = stats.hourlyRequests.filter(
    entry => entry.timestamp > oneHourAgo
  );
  
  const recentErrors = stats.lastErrors.filter(
    error => error.timestamp > oneHourAgo
  );

  const errorRate = stats.totalRequests > 0 
    ? (stats.totalErrors / stats.totalRequests) * 100 
    : 0;

  return NextResponse.json({
    summary: {
      totalRequests: stats.totalRequests,
      totalErrors: stats.totalErrors,
      errorRate: Math.round(errorRate * 100) / 100,
      status: errorRate < 5 ? 'healthy' : errorRate < 15 ? 'warning' : 'critical'
    },
    hourlyData: recentHourlyData,
    recentErrors: recentErrors.slice(-10), // 최근 10개 에러
    errorsByStatus: stats.errorsByStatus
  });
}

export async function POST(request: NextRequest) {
  try {
    const { 
      status, 
      error, 
      responseTime, 
      endpoint 
    } = await request.json();

    // 통계 업데이트
    stats.totalRequests++;
    
    if (status >= 400) {
      stats.totalErrors++;
      stats.errorsByStatus[status] = (stats.errorsByStatus[status] || 0) + 1;
      
      // 에러 로그 저장
      stats.lastErrors.push({
        timestamp: Date.now(),
        status,
        error,
        responseTime
      });
      
      // 최근 100개 에러만 유지
      if (stats.lastErrors.length > 100) {
        stats.lastErrors = stats.lastErrors.slice(-100);
      }
    }

    // 시간별 통계 업데이트
    const currentHour = Math.floor(Date.now() / (60 * 60 * 1000)) * (60 * 60 * 1000);
    const existingHourIndex = stats.hourlyRequests.findIndex(
      entry => entry.timestamp === currentHour
    );

    if (existingHourIndex >= 0) {
      stats.hourlyRequests[existingHourIndex].count++;
      if (status >= 400) {
        stats.hourlyRequests[existingHourIndex].errors++;
      }
    } else {
      stats.hourlyRequests.push({
        timestamp: currentHour,
        count: 1,
        errors: status >= 400 ? 1 : 0
      });
      
      // 24시간 이전 데이터는 제거
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      stats.hourlyRequests = stats.hourlyRequests.filter(
        entry => entry.timestamp > oneDayAgo
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record API stats:', error);
    return NextResponse.json({ error: 'Failed to record stats' }, { status: 500 });
  }
}