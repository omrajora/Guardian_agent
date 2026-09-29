const { connectDB, disconnectDB } = require('../backend/src/config/db');
const { seedDatabase } = require('../backend/src/config/seed');
const { runScenario, listScenarios } = require('../backend/src/services/simulator/simulatorService');

async function testSimulatorScenarios() {
  console.log('================================================================');
  console.log('🛡️  Running Guardian Agent 2.0 Security & Attack Simulation Test');
  console.log('================================================================');

  await connectDB();
  await seedDatabase();

  const scenarios = listScenarios();
  let passed = 0;
  let failed = 0;

  for (const s of scenarios) {
    const outcome = await runScenario(s.id);
    const mark = outcome.passed ? '✅ PASS' : '❌ FAIL';
    console.log(
      `${mark} [${s.id}] Expected: ${s.expectedDecision} | Actual: ${outcome.actualDecision} | Latency: ${outcome.latencyMs}ms`
    );
    console.log(`   Reason: ${outcome.reason}`);

    if (outcome.passed) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('================================================================');
  console.log(`Summary: ${passed} Passed, ${failed} Failed out of ${scenarios.length} scenarios.`);
  console.log('================================================================');

  await disconnectDB();

  if (failed > 0) {
    process.exit(1);
  }
}

testSimulatorScenarios().catch((err) => {
  console.error('Simulation error:', err);
  process.exit(1);
});
