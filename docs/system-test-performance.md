# System Test — Performance Testing

## TC-PT01: Performance and Load Testing with JMeter

| Field | Value |
|---|---|
| **Test Case ID** | TC-PT01 |
| **Test Case Description** | Verify system performance and stability under concurrent load (10–50 users) across multiple API endpoints using Apache JMeter |
| **Pre-conditions** | - System deployed on AWS with ALB: http://slife-alb-1599859064.ap-southeast-1.elb.amazonaws.com - 3 EC2 instances (t3.micro) healthy in ALB Target Group - RDS MySQL 8.4 (db.t4g.micro, Multi-AZ standby) available - ElastiCache Redis 7.1 (cache.t3.micro, Replication Group 1 primary + 1 replica) available - Apache JMeter 5.6.3 installed on local machine |
| **Test Case Procedure** | 1. Install Apache JMeter 5.6.3 from https://jmeter.apache.org 2. Open JMeter GUI: run jmeter.bat from JMeter bin/ folder 3. Load test plan: File > Open > select benchmark/slife-benchmark.jmx 4. The test plan contains 6 Thread Groups running in parallel: Health Check (10 threads, 30s), Categories (20 threads, 30s), Listings (20 threads, 30s), Search (10 threads, 30s), Community Posts (15 threads, 30s), Stress Test (50 threads, 60s) 5. Click Run to start all tests 6. View results in Summary Report and Aggregate Report listeners 7. For HTML report: run CLI mode jmeter -n -t slife-benchmark.jmx -l results.jtl -e -o html-report |
| **Expected Results** | - Average response time < 500ms for all endpoints - Error rate < 1% - Throughput > 100 req/s total - System remains stable (no crash, no 5xx errors) under 50 concurrent users |
| **Actual Results** | Total: 18,609 requests, 0 errors (0.00%), avg 221ms. Health Check (10 users): 1,996 samples, avg 148ms, 57.8 req/s. Categories (20 users): 2,574 samples, avg 210ms, 73.7 req/s. Listings (20 users): 2,038 samples, avg 259ms, 58.9 req/s. Search (10 users): 1,267 samples, avg 229ms, 37.7 req/s. Community Posts (15 users): 2,152 samples, avg 205ms, 61.4 req/s. Stress Test (50 users): 8,626 samples, avg 273ms, 132.7 req/s. All 0% error. System stable. Estimated capacity: 500-2,000 concurrent users. |
| **Status** | **Passed** |
| **Round 1** | Passed |
| **Test date** | 27/04/2026 |
| **Tester** | HoaLTT |
| **Note** | Individual HTML reports available at `benchmark/results/tc-pt01-health/html-report/`, `tc-pt02-categories/`, `tc-pt03-listings/`, `tc-pt04-search/`, `tc-pt05-community/`, `tc-pt06-stress/`. JMeter test plan files: `benchmark/tc-pt01-health.jmx` through `tc-pt06-stress.jmx`. |

### Results Summary Table

| Endpoint | Concurrent Users | Duration | Samples | Avg (ms) | Min (ms) | Max (ms) | Error % | Throughput |
|---|---|---|---|---|---|---|---|---|
| `GET /actuator/health` | 10 | 30s | 1,996 | 148 | 88 | 5,124 | 0% | 57.8/s |
| `GET /api/categories` | 20 | 30s | 2,574 | 210 | 90 | 5,123 | 0% | 73.7/s |
| `GET /api/listings?page=0&size=10` | 20 | 30s | 2,038 | 259 | 94 | 5,498 | 0% | 58.9/s |
| `GET /api/search?keyword=tai+nghe` | 10 | 30s | 1,267 | 229 | 107 | 5,147 | 0% | 37.7/s |
| `GET /api/community/posts?size=10` | 15 | 30s | 2,152 | 205 | 95 | 5,124 | 0% | 61.4/s |
| `GET /api/listings` (stress) | 50 | 60s | 8,626 | 273 | 93 | 5,353 | 0% | 132.7/s |

### Test Environment

| Component | Specification |
|---|---|
| ALB | `slife-alb-1599859064.ap-southeast-1.elb.amazonaws.com` |
| EC2 | 3x t3.micro (1 vCPU, 1GB RAM), AZ: ap-southeast-1a, 1b, 1c |
| RDS | db.t4g.micro, MySQL 8.4, Multi-AZ standby enabled |
| Redis | cache.t3.micro, Replication Group (1 primary + 1 replica) |
| Region | ap-southeast-1 (Singapore) |
| JMeter | Apache JMeter 5.6.3, executed from local machine (Vietnam) |
| Test Plan | `benchmark/slife-benchmark.jmx` (combined), `benchmark/tc-pt01..06-*.jmx` (individual) |
