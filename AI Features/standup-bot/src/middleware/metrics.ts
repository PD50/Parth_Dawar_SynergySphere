import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface Metrics {
  agg_latency_ms: number[];
  compose_latency_ms: number[];
  post_latency_ms: number[];
  llm_failures_total: number;
  duplicate_suppressed_total: number;
}

class MetricsCollector {
  private metrics: Metrics = {
    agg_latency_ms: [],
    compose_latency_ms: [],
    post_latency_ms: [],
    llm_failures_total: 0,
    duplicate_suppressed_total: 0
  };

  recordAggregationLatency(latency: number) {
    this.metrics.agg_latency_ms.push(latency);
    if (this.metrics.agg_latency_ms.length > 100) {
      this.metrics.agg_latency_ms.shift();
    }
  }

  recordCompositionLatency(latency: number) {
    this.metrics.compose_latency_ms.push(latency);
    if (this.metrics.compose_latency_ms.length > 100) {
      this.metrics.compose_latency_ms.shift();
    }
  }

  recordPostLatency(latency: number) {
    this.metrics.post_latency_ms.push(latency);
    if (this.metrics.post_latency_ms.length > 100) {
      this.metrics.post_latency_ms.shift();
    }
  }

  incrementLLMFailures() {
    this.metrics.llm_failures_total++;
  }

  incrementDuplicatesSuppressed() {
    this.metrics.duplicate_suppressed_total++;
  }

  getMetrics() {
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const p95 = (arr: number[]) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const index = Math.ceil(sorted.length * 0.95) - 1;
      return sorted[index] || 0;
    };

    return {
      agg_latency_ms_avg: avg(this.metrics.agg_latency_ms),
      agg_latency_ms_p95: p95(this.metrics.agg_latency_ms),
      compose_latency_ms_avg: avg(this.metrics.compose_latency_ms),
      compose_latency_ms_p95: p95(this.metrics.compose_latency_ms),
      post_latency_ms_avg: avg(this.metrics.post_latency_ms),
      post_latency_ms_p95: p95(this.metrics.post_latency_ms),
      llm_failures_total: this.metrics.llm_failures_total,
      duplicate_suppressed_total: this.metrics.duplicate_suppressed_total
    };
  }

  getPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    return `
# HELP agg_latency_ms_avg Average aggregation latency in milliseconds
# TYPE agg_latency_ms_avg gauge
agg_latency_ms_avg ${metrics.agg_latency_ms_avg}

# HELP agg_latency_ms_p95 95th percentile aggregation latency in milliseconds  
# TYPE agg_latency_ms_p95 gauge
agg_latency_ms_p95 ${metrics.agg_latency_ms_p95}

# HELP compose_latency_ms_avg Average composition latency in milliseconds
# TYPE compose_latency_ms_avg gauge
compose_latency_ms_avg ${metrics.compose_latency_ms_avg}

# HELP compose_latency_ms_p95 95th percentile composition latency in milliseconds
# TYPE compose_latency_ms_p95 gauge
compose_latency_ms_p95 ${metrics.compose_latency_ms_p95}

# HELP post_latency_ms_avg Average posting latency in milliseconds
# TYPE post_latency_ms_avg gauge
post_latency_ms_avg ${metrics.post_latency_ms_avg}

# HELP post_latency_ms_p95 95th percentile posting latency in milliseconds
# TYPE post_latency_ms_p95 gauge
post_latency_ms_p95 ${metrics.post_latency_ms_p95}

# HELP llm_failures_total Total number of LLM failures
# TYPE llm_failures_total counter
llm_failures_total ${metrics.llm_failures_total}

# HELP duplicate_suppressed_total Total number of duplicate posts suppressed
# TYPE duplicate_suppressed_total counter
duplicate_suppressed_total ${metrics.duplicate_suppressed_total}
    `.trim();
  }
}

export const metricsCollector = new MetricsCollector();

export async function metricsRoutes(fastify: FastifyInstance) {
  fastify.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('Content-Type', 'text/plain');
    return metricsCollector.getPrometheusMetrics();
  });
}