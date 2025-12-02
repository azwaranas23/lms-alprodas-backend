import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

// Stress test configuration - aggressive for constrained resources
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Quick ramp to 20 users
    { duration: '1m', target: 40 }, // Heavy load: 40 concurrent users
    { duration: '30s', target: 60 }, // Spike to 60 users (stress point)
    { duration: '30s', target: 40 }, // Back down to 40
    { duration: '1m', target: 0 }, // Gradual cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Very lenient: 2 seconds for constrained resources
    http_req_failed: ['rate<0.5'], // Allow 50% failures under stress
    errors: ['rate<0.6'], // Custom error rate
  },
};

// Base URL from environment or default
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3005/api';

export default function () {
  // More aggressive test pattern - focus on auth throttling
  const scenarios = [
    { weight: 20, test: testHealthCheck }, // Reduced health checks
    { weight: 30, test: testPublicEndpoints }, // More public API calls
    { weight: 40, test: testAuth }, // Heavy auth testing (throttle stress)
    { weight: 10, test: testProtectedEndpoints },
  ];

  // Select random scenario based on weights
  const random = Math.random() * 100;
  let currentWeight = 0;

  for (const scenario of scenarios) {
    currentWeight += scenario.weight;
    if (random <= currentWeight) {
      scenario.test();
      break;
    }
  }

  // Reduced sleep time for more aggressive testing
  sleep(Math.random() * 0.3 + 0.1); // 0.1-0.4 seconds
}

function testHealthCheck() {
  const response = http.get(`${BASE_URL}/`);

  console.log(
    `[Health] Status: ${response.status}, Time: ${response.timings.duration.toFixed(2)}ms, Memory: ${(__VU - 1) * 10 + 10}MB sim`,
  );

  if (response.status !== 200) {
    console.log(
      `[Health ERROR] ${response.status}: ${response.body.substring(0, 100)}...`,
    );
  }

  check(response, {
    'health check responds': (r) => r.status !== undefined,
    'health check under 500ms': (r) => r.timings.duration < 500,
  });

  requestCount.add(1);
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
}

function testPublicEndpoints() {
  const endpoints = [
    '/front/topics?page=1&limit=5', // Smaller page size for stress
    '/front/courses?page=1&limit=5',
    '/front/subjects?page=1&limit=5',
    '/front/courses/most-joined',
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = http.get(`${BASE_URL}${endpoint}`);

  console.log(
    `[Public] ${endpoint.split('?')[0]} - Status: ${response.status}, Time: ${response.timings.duration.toFixed(2)}ms, VU: ${__VU}`,
  );

  if (response.status === 429) {
    console.log(
      `[Public THROTTLED] ${endpoint} - Rate limited after ${requestCount.value} requests`,
    );
  } else if (response.status >= 500) {
    console.log(
      `[Public ERROR] ${endpoint} - Server overloaded: ${response.status}`,
    );
  } else if (response.status === 200) {
    try {
      const data = JSON.parse(response.body);
      console.log(
        `[Public OK] ${endpoint.split('?')[0]} - Items: ${data.data?.length || 'N/A'}`,
      );
    } catch (e) {
      console.log(`[Public PARSE ERROR] ${endpoint} - Invalid response`);
    }
  }

  check(response, {
    'public endpoint responds': (r) => r.status !== undefined,
    'public not server error': (r) => r.status < 500,
  });

  requestCount.add(1);
  errorRate.add(response.status >= 400);
  responseTime.add(response.timings.duration);
}

function testAuth() {
  // Multiple login attempts to trigger throttling
  const loginPayload = {
    email: `test${Math.floor(Math.random() * 3)}@example.com`, // Vary emails slightly
    password: 'Password123',
  };

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const response = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify(loginPayload),
    params,
  );

  console.log(
    `[AUTH] VU:${__VU} - Status: ${response.status}, Time: ${response.timings.duration.toFixed(2)}ms, Req#: ${requestCount.value}`,
  );

  if (response.status === 429) {
    console.log(
      `[AUTH THROTTLED ⚡] VU:${__VU} - RATE LIMITED! Total requests: ${requestCount.value}`,
    );
    try {
      const data = JSON.parse(response.body);
      console.log(`[AUTH THROTTLED] Throttle message: ${data.message}`);

      // Log rate limiting details if available
      const retryAfter =
        response.headers['Retry-After'] || response.headers['retry-after'];
      if (retryAfter) {
        console.log(`[AUTH THROTTLED] Retry after: ${retryAfter} seconds`);
      }
    } catch (e) {
      console.log(`[AUTH THROTTLED] Raw: ${response.body.substring(0, 100)}`);
    }
  } else if (response.status === 401) {
    console.log(`[AUTH] VU:${__VU} - Invalid creds (expected)`);
  } else if (response.status >= 500) {
    console.log(
      `[AUTH ERROR ❌] VU:${__VU} - Server error ${response.status}: System overloaded?`,
    );
  } else if (response.status === 200) {
    console.log(
      `[AUTH UNEXPECTED ✅] VU:${__VU} - Login succeeded?? Status: ${response.status}`,
    );
  }

  check(response, {
    'auth responds': (r) => r.status !== undefined,
    'auth response valid': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.message !== undefined;
      } catch {
        return false;
      }
    },
    'auth not server crash': (r) => r.status < 500,
  });

  requestCount.add(1);
  errorRate.add(response.status >= 500); // Only server errors count as failures
  responseTime.add(response.timings.duration);
}

function testProtectedEndpoints() {
  const endpoints = ['/courses', '/topics', '/subjects'];
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = http.get(`${BASE_URL}${endpoint}`);

  console.log(
    `[Protected] VU:${__VU} ${endpoint} - Status: ${response.status}, Time: ${response.timings.duration.toFixed(2)}ms`,
  );

  if (response.status === 429) {
    console.log(`[Protected THROTTLED] ${endpoint} - Global rate limit hit`);
  }

  check(response, {
    'protected responds': (r) => r.status !== undefined,
    'protected not crash': (r) => r.status < 500,
  });

  requestCount.add(1);
  errorRate.add(response.status >= 500);
  responseTime.add(response.timings.duration);
}

// Setup function with resource constraint info
export function setup() {
  console.log(`🚀 STRESS TEST - Constrained Resources`);
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log(`📡 Testing API endpoints with /api prefix`);
  console.log(`⚡ Profile: 60 peak users, aggressive throttle testing`);
  console.log(`💾 App Resources: 0.5 CPU, 256MB RAM`);
  console.log(`🗄️  DB Resources: 0.3 CPU, 128MB RAM`);
  console.log(`📦 Redis Resources: 0.2 CPU, 64MB RAM`);
  console.log('=====================================');

  // Health check
  const response = http.get(`${BASE_URL}/`);
  if (response.status !== 200) {
    console.warn(`⚠️  API not ready: ${response.status}`);
  } else {
    console.log('✅ API responding with /api prefix');
  }
}

// Teardown with summary
export function teardown() {
  console.log('=====================================');
  console.log('🏁 STRESS TEST COMPLETED');
  console.log('💡 Check if containers survived the stress!');
  console.log('📊 Expected: High throttle rate, some timeouts');
  console.log('🔍 Next: Run "docker stats" to see resource usage');
}
