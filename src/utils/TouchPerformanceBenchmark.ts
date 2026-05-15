/**
 * Touch Input Performance Benchmark
 * 
 * 用於測量觸控輸入響應延遲的工具類
 * 任務 4.2.4: 驗證觸控到移動延遲不超過 2 幀
 */

export interface PerformanceMetrics {
  minLatency: number;
  maxLatency: number;
  avgLatency: number;
  samples: number;
  timestamp: number;
}

export class TouchPerformanceBenchmark {
  private latencies: number[] = [];
  private readonly maxSamples: number = 100;

  /**
   * 記錄一次觸控事件的處理延遲
   * @param startTime 事件開始時間（performance.now()）
   * @param endTime 事件結束時間（performance.now()）
   */
  recordLatency(startTime: number, endTime: number): void {
    const latency = endTime - startTime;
    this.latencies.push(latency);

    // 保持最近 100 個樣本
    if (this.latencies.length > this.maxSamples) {
      this.latencies.shift();
    }
  }

  /**
   * 獲取性能指標
   */
  getMetrics(): PerformanceMetrics {
    if (this.latencies.length === 0) {
      return {
        minLatency: 0,
        maxLatency: 0,
        avgLatency: 0,
        samples: 0,
        timestamp: Date.now(),
      };
    }

    const min = Math.min(...this.latencies);
    const max = Math.max(...this.latencies);
    const avg = this.latencies.reduce((sum, l) => sum + l, 0) / this.latencies.length;

    return {
      minLatency: min,
      maxLatency: max,
      avgLatency: avg,
      samples: this.latencies.length,
      timestamp: Date.now(),
    };
  }

  /**
   * 檢查是否滿足性能要求
   * @param targetLatencyMs 目標延遲（毫秒），預設 33ms (2 幀 @ 60FPS)
   */
  meetsRequirement(targetLatencyMs: number = 33): boolean {
    const metrics = this.getMetrics();
    return metrics.maxLatency < targetLatencyMs;
  }

  /**
   * 生成性能報告
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const target = 33; // 2 幀 @ 60FPS

    const report = [
      '=== Touch Input Performance Report ===',
      `Samples: ${metrics.samples}`,
      `Min Latency: ${metrics.minLatency.toFixed(3)}ms`,
      `Max Latency: ${metrics.maxLatency.toFixed(3)}ms`,
      `Avg Latency: ${metrics.avgLatency.toFixed(3)}ms`,
      `Target: < ${target}ms (2 frames @ 60FPS)`,
      `Status: ${metrics.maxLatency < target ? '✅ PASS' : '❌ FAIL'}`,
      `Margin: ${(target - metrics.maxLatency).toFixed(3)}ms`,
      '=====================================',
    ];

    return report.join('\n');
  }

  /**
   * 重置統計數據
   */
  reset(): void {
    this.latencies = [];
  }

  /**
   * 獲取原始延遲數據（用於詳細分析）
   */
  getRawLatencies(): readonly number[] {
    return this.latencies;
  }
}

/**
 * 全域性能監控實例（開發模式使用）
 */
export const touchPerformanceMonitor = new TouchPerformanceBenchmark();

/**
 * 在開發模式下啟用性能監控
 */
export function enablePerformanceMonitoring(): void {
  if (import.meta.env.DEV) {
    // 每 5 秒輸出一次性能報告
    setInterval(() => {
      const metrics = touchPerformanceMonitor.getMetrics();
      if (metrics.samples > 0) {
        console.log(touchPerformanceMonitor.generateReport());
      }
    }, 5000);

    console.log('Touch performance monitoring enabled');
  }
}

/**
 * 裝飾器：測量函數執行時間
 */
export function measureLatency(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const startTime = performance.now();
    const result = originalMethod.apply(this, args);
    const endTime = performance.now();

    touchPerformanceMonitor.recordLatency(startTime, endTime);

    return result;
  };

  return descriptor;
}
