#!/usr/bin/env node

const { execSync } = require('child_process')
const { collectMetrics, saveMetrics } = require('./collect-metrics')

/**
 * Main orchestrator for baseline measurement
 * Runs tests, builds, and collects all metrics
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function runCommand(command, description, options = {}) {
  log(`\n${description}...`, colors.cyan)

  const startTime = Date.now()

  try {
    const output = execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: process.cwd(),
      encoding: 'utf-8',
      ...options,
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    log(`✅ Completed in ${duration}s`, colors.green)

    return { success: true, output, duration: parseFloat(duration) }
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    log(`⚠️ Failed after ${duration}s`, colors.yellow)

    if (!options.ignoreError) {
      log(`Error: ${error.message}`, colors.yellow)
    }

    return { success: false, error: error.message, duration: parseFloat(duration) }
  }
}

async function measureBaseline(options = {}) {
  const { skipTests = false, skipBuild = false, skipAnalyze = false } = options

  log('╔═══════════════════════════════════════════════════════════╗', colors.bright)
  log('║        BASELINE MEASUREMENT - STARTING COLLECTION        ║', colors.bright)
  log('╚═══════════════════════════════════════════════════════════╝', colors.bright)

  const timings = {}

  // Step 1: Run Jest tests with coverage (unless skipped)
  if (!skipTests) {
    log('\n📋 STEP 1/4: Running Jest tests with coverage', colors.blue)
    const result = runCommand('npm run test:cov', 'Running Jest tests with coverage', { ignoreError: true })
    timings.jestTests = result.duration
  } else {
    log('\n📋 STEP 1/4: Skipping Jest tests (use --tests to include)', colors.yellow)
  }

  // Step 2: Run production build (unless skipped)
  if (!skipBuild) {
    log('\n🏗️  STEP 2/4: Running production build', colors.blue)

    // Clean previous build
    log('  Cleaning previous build artifacts...', colors.cyan)
    runCommand('rm -rf .next dist', 'Cleaning build directories', { silent: true })

    const buildResult = runCommand('npm run build', 'Building Next.js and NestJS', { ignoreError: true })
    timings.build = buildResult.duration
  } else {
    log('\n🏗️  STEP 2/4: Skipping production build (use --build to include)', colors.yellow)
  }

  // Step 3: Run bundle analyzer (unless skipped)
  if (!skipAnalyze && !skipBuild) {
    log('\n📊 STEP 3/4: Running bundle analyzer', colors.blue)

    // Clean previous build
    runCommand('rm -rf .next', 'Cleaning .next directory', { silent: true })

    const analyzeResult = runCommand(
      'ANALYZE=true npm run build:next',
      'Analyzing bundle (this will open in browser)',
      { ignoreError: true },
    )
    timings.analyze = analyzeResult.duration

    log('\n  💡 Bundle analyzer report opened in your browser', colors.cyan)
    log('  💡 Review it to identify optimization opportunities', colors.cyan)
  } else {
    log('\n📊 STEP 3/4: Skipping bundle analyzer (use --analyze to include)', colors.yellow)
  }

  // Step 4: Collect all metrics
  log('\n📦 STEP 4/4: Collecting metrics', colors.blue)
  const metrics = collectMetrics()

  // Add timing data
  metrics.timings = timings

  // Save metrics
  const filePath = saveMetrics(metrics)

  // Print final summary
  log('\n╔═══════════════════════════════════════════════════════════╗', colors.bright)
  log('║            BASELINE MEASUREMENT COMPLETED                 ║', colors.bright)
  log('╚═══════════════════════════════════════════════════════════╝', colors.bright)

  printDetailedSummary(metrics)

  log('\n💾 Metrics saved to:', colors.green)
  log(`   ${filePath}`, colors.bright)

  log('\n🎯 Next Steps:', colors.cyan)
  log('   1. Review the metrics above and saved JSON file')
  log('   2. Identify optimization opportunities')
  log('   3. Make your refactoring changes')
  log('   4. Run "npm run measure:baseline" again to capture new metrics')
  log('   5. Run "npm run measure:compare <baseline1> <baseline2>" to compare')
  log('')

  return metrics
}

function printDetailedSummary(metrics) {
  console.log('\n' + '='.repeat(70))
  console.log('📊 DETAILED METRICS SUMMARY')
  console.log('='.repeat(70))

  // Build Performance
  console.log('\n🏗️  Build Performance:')
  console.log('   ├─ Next.js build size: ' + formatBytes(metrics.build.nextjsSize))
  console.log('   ├─ NestJS build size: ' + formatBytes(metrics.build.nestjsSize))
  console.log('   ├─ Total pages: ' + (metrics.build.pages || 'N/A'))
  if (metrics.timings.build) {
    console.log('   └─ Build time: ' + metrics.timings.build.toFixed(2) + 's')
  }

  // Test Results
  console.log('\n🧪 Test Results:')
  console.log('   ├─ Jest test files: ' + (metrics.tests.jest.testFiles || 'N/A'))
  console.log('   ├─ Playwright test files: ' + (metrics.tests.playwright.testFiles || 'N/A'))
  if (metrics.timings.jestTests) {
    console.log('   └─ Jest execution time: ' + metrics.timings.jestTests.toFixed(2) + 's')
  }

  // Test Coverage
  console.log('\n📊 Test Coverage:')
  console.log('   ├─ Lines: ' + metrics.tests.jest.coverage.lines.toFixed(1) + '%')
  console.log('   ├─ Statements: ' + metrics.tests.jest.coverage.statements.toFixed(1) + '%')
  console.log('   ├─ Functions: ' + metrics.tests.jest.coverage.functions.toFixed(1) + '%')
  console.log('   └─ Branches: ' + metrics.tests.jest.coverage.branches.toFixed(1) + '%')

  // Code Metrics
  console.log('\n📝 Code Metrics:')
  console.log('   ├─ Total files: ' + metrics.code.totalFiles)
  console.log('   ├─ TypeScript files: ' + metrics.code.typeScriptFiles)
  console.log('   ├─ React components: ' + metrics.code.reactComponents)
  console.log('   ├─ Test files: ' + metrics.code.testFiles)
  console.log('   ├─ Pages: ' + (metrics.code.pages || 'N/A'))
  console.log('   └─ Component files: ' + (metrics.code.components || 'N/A'))

  // Bundle Analysis
  console.log('\n📦 Bundle Analysis:')
  console.log('   ├─ Total dependencies: ' + metrics.bundle.totalDependencies)
  console.log('   ├─ Major dependencies:')
  Object.entries(metrics.bundle.dependencies).forEach(([name, version]) => {
    console.log('   │  ├─ ' + name + ': ' + version)
  })
  if (metrics.bundle.largestChunks.length > 0) {
    console.log('   └─ Largest chunks:')
    metrics.bundle.largestChunks.slice(0, 5).forEach((chunk, idx) => {
      const isLast = idx === Math.min(4, metrics.bundle.largestChunks.length - 1)
      const prefix = isLast ? '      └─' : '      ├─'
      console.log(`${prefix} ${chunk.name}: ${formatBytes(chunk.size)}`)
    })
  }

  console.log('\n' + '='.repeat(70))

  // Highlight areas for optimization
  console.log('\n🎯 Optimization Opportunities:')

  const opportunities = []

  // Check coverage
  if (metrics.tests.jest.coverage.lines < 70) {
    opportunities.push('⚠️  Test coverage is below 70% - consider adding more tests')
  }

  // Check build size
  if (metrics.build.nextjsSize > 50 * 1024 * 1024) {
    opportunities.push('⚠️  Next.js build is over 50MB - consider code splitting')
  }

  // Check large chunks
  if (metrics.bundle.largestChunks.length > 0) {
    const largeChunks = metrics.bundle.largestChunks.filter((c) => c.size > 500 * 1024)
    if (largeChunks.length > 0) {
      opportunities.push(`⚠️  ${largeChunks.length} chunks are over 500KB - review bundle analyzer`)
    }
  }

  if (opportunities.length === 0) {
    console.log('   ✅ No major optimization opportunities detected')
  } else {
    opportunities.forEach((opp) => console.log('   ' + opp))
  }

  console.log('\n' + '='.repeat(70))
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    skipTests: args.includes('--skip-tests'),
    skipBuild: args.includes('--skip-build'),
    skipAnalyze: args.includes('--skip-analyze'),
    help: args.includes('--help') || args.includes('-h'),
  }

  return options
}

function printHelp() {
  console.log(`
Usage: npm run measure:baseline [options]

Captures comprehensive baseline metrics for your codebase including:
- Build sizes and performance
- Test coverage and execution time
- Bundle analysis
- Code metrics

Options:
  --skip-tests     Skip running Jest tests with coverage
  --skip-build     Skip running production build
  --skip-analyze   Skip running bundle analyzer
  --help, -h       Show this help message

Examples:
  npm run measure:baseline                # Full measurement (recommended)
  npm run measure:baseline -- --skip-tests  # Skip tests, only measure build
  npm run measure:baseline -- --skip-analyze # Skip bundle analyzer

After running, metrics will be saved to:
  metrics/baseline-YYYY-MM-DD.json

To compare two baselines:
  npm run measure:compare baseline1.json baseline2.json
`)
}

// Main execution
if (require.main === module) {
  const options = parseArgs()

  if (options.help) {
    printHelp()
    process.exit(0)
  }

  measureBaseline(options)
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      log('\n❌ Error during measurement:', colors.yellow)
      console.error(error)
      process.exit(1)
    })
}

module.exports = { measureBaseline }
