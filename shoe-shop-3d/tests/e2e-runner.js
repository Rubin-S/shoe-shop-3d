/**
 * AEROPRO-X LAB 3D Shoe Shop - Master E2E Automated Test Runner
 *
 * Discovers and executes all 4 test tiers:
 * - Tier 1: Feature Coverage (80 tests across 16 features)
 * - Tier 2: Boundary & Corner Cases (80 tests across 16 features)
 * - Tier 3: Cross-Feature Interactions (18 integration tests)
 * - Tier 4: Real-World Scenarios (10 end-to-end user journeys)
 *
 * Run via: node tests/e2e-runner.js
 */

import { tier1Registry } from './tier1-feature.test.js';
import { tier2Registry } from './tier2-boundary.test.js';
import { tier3Registry } from './tier3-integration.test.js';
import { tier4Registry } from './tier4-scenarios.test.js';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  bgGreen: '\x1b[42m\x1b[30m',
  bgRed: '\x1b[41m\x1b[37m'
};

async function runMasterSuite() {
  console.log(`\n${ANSI.bold}${ANSI.cyan}======================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}   AEROPRO-X LAB - Automated E2E Test Suite (Tiers 1 - 4)${ANSI.reset}`);
  console.log(`${ANSI.gray}   Environment: Node.js ${process.version} | Timestamp: ${new Date().toISOString()}${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}======================================================================${ANSI.reset}\n`);

  const registries = [
    tier1Registry,
    tier2Registry,
    tier3Registry,
    tier4Registry
  ];

  const results = [];
  let grandTotal = 0;
  let grandPassed = 0;
  let grandFailed = 0;
  const grandStartTime = Date.now();

  for (const reg of registries) {
    process.stdout.write(`  ${ANSI.yellow}Running ${reg.tierName}...${ANSI.reset}`);
    const res = await reg.run();
    results.push(res);
    grandTotal += res.total;
    grandPassed += res.passed;
    grandFailed += res.failed;

    if (res.failed === 0) {
      console.log(`\r  ${ANSI.green}✓ ${reg.tierName}${ANSI.reset} ${ANSI.gray}(${res.passed}/${res.total} passed in ${res.durationMs}ms)${ANSI.reset}`);
    } else {
      console.log(`\r  ${ANSI.red}✗ ${reg.tierName}${ANSI.reset} ${ANSI.red}(${res.failed} failed!)${ANSI.reset}`);
    }
  }

  const grandDurationMs = Date.now() - grandStartTime;

  console.log(`\n${ANSI.bold}----------------------------------------------------------------------${ANSI.reset}`);
  console.log(`${ANSI.bold} TIER BREAKDOWN & COVERAGE MATRIX${ANSI.reset}`);
  console.log(`${ANSI.bold}----------------------------------------------------------------------${ANSI.reset}`);
  console.log(`  ${'Tier Name'.padEnd(46)} | ${'Pass'.padStart(6)} | ${'Fail'.padStart(6)} | ${'Total'.padStart(6)} | ${'Time'.padStart(8)}`);
  console.log(`  ${''.padEnd(46, '-')} | ${''.padStart(6, '-')} | ${''.padStart(6, '-')} | ${''.padStart(6, '-')} | ${''.padStart(8, '-')}`);

  for (const r of results) {
    const passStr = `${ANSI.green}${r.passed.toString().padStart(6)}${ANSI.reset}`;
    const failStr = r.failed > 0
      ? `${ANSI.red}${r.failed.toString().padStart(6)}${ANSI.reset}`
      : `${ANSI.gray}${r.failed.toString().padStart(6)}${ANSI.reset}`;
    const totalStr = r.total.toString().padStart(6);
    const timeStr = `${r.durationMs}ms`.padStart(8);
    console.log(`  ${r.tierName.padEnd(46)} | ${passStr} | ${failStr} | ${totalStr} | ${timeStr}`);
  }

  console.log(`${ANSI.bold}----------------------------------------------------------------------${ANSI.reset}`);
  const passRate = grandTotal > 0 ? ((grandPassed / grandTotal) * 100).toFixed(1) : 0;
  console.log(`  ${ANSI.bold}${'TOTAL'.padEnd(46)}${ANSI.reset} | ${ANSI.bold}${ANSI.green}${grandPassed.toString().padStart(6)}${ANSI.reset} | ${ANSI.bold}${grandFailed > 0 ? ANSI.red : ANSI.gray}${grandFailed.toString().padStart(6)}${ANSI.reset} | ${ANSI.bold}${grandTotal.toString().padStart(6)}${ANSI.reset} | ${ANSI.bold}${grandDurationMs}ms`.padStart(8));
  console.log(`${ANSI.bold}----------------------------------------------------------------------${ANSI.reset}\n`);

  if (grandFailed > 0) {
    console.log(`${ANSI.bold}${ANSI.red}FAILURES DETECTED (${grandFailed}):${ANSI.reset}`);
    for (const r of results) {
      for (const f of r.failures) {
        console.error(`  ${ANSI.red}✗ [${r.tierName}] ${f.suite} > ${f.test}${ANSI.reset}`);
        console.error(`    ${ANSI.gray}${f.error}${ANSI.reset}`);
      }
    }
    console.log(`\n${ANSI.bgRed} TEST RUN FAILED ${ANSI.reset} (${grandFailed}/${grandTotal} failed, ${passRate}% pass rate)\n`);
    process.exit(1);
  } else {
    console.log(`${ANSI.bgGreen} TEST RUN PASSED ${ANSI.reset} All ${grandTotal} tests passed! (${passRate}% pass rate in ${grandDurationMs}ms)\n`);
    process.exit(0);
  }
}

runMasterSuite().catch((err) => {
  console.error('Master Test Runner Crash:', err);
  process.exit(1);
});
