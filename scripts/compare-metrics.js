#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * Compare two baseline metric files and generate a comparison report
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function compareMetrics(baselineFile1, baselineFile2) {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║            METRICS COMPARISON REPORT                     ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  // Load both metric files
  const metrics1 = loadMetricsFile(baselineFile1)
  const metrics2 = loadMetricsFile(baselineFile2)

  if (!metrics1 || !metrics2) {
    console.error('❌ Failed to load one or both metric files')
    process.exit(1)
  }

  console.log(`📅 Baseline 1: ${metrics1.date} (${metrics1.timestamp})`)
  console.log(`📅 Baseline 2: ${metrics2.date} (${metrics2.timestamp})\n`)

  // Generate comparison
  const comparison = {
    build: compareBuildMetrics(metrics1.build, metrics2.build),
    tests: compareTestMetrics(metrics1.tests, metrics2.tests),
    bundle: compareBundleMetrics(metrics1.bundle, metrics2.bundle),
    code: compareCodeMetrics(metrics1.code, metrics2.code),
  }

  // Print detailed comparison
  printComparison(comparison)

  // Generate summary
  printSummary(comparison)

  // Save comparison report
  saveComparisonReport(comparison, metrics1, metrics2)

  return comparison
}

function loadMetricsFile(filePath) {
  try {
    // If it's a relative path, resolve it from metrics directory or cwd
    let resolvedPath = filePath

    if (!path.isAbsolute(filePath)) {
      const metricsDir = path.join(process.cwd(), 'metrics')
      const possiblePaths = [
        filePath,
        path.join(process.cwd(), filePath),
        path.join(metricsDir, filePath),
        path.join(metricsDir, `baseline-${filePath}.json`),
      ]

      resolvedPath = possiblePaths.find((p) => fs.existsSync(p))

      if (!resolvedPath) {
        console.error(`❌ Could not find metrics file: ${filePath}`)
        console.error('   Searched in:')
        possiblePaths.forEach((p) => console.error(`   - ${p}`))
        return null
      }
    }

    const content = fs.readFileSync(resolvedPath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    console.error(`❌ Error loading metrics file: ${filePath}`)
    console.error(`   ${error.message}`)
    return null
  }
}

function compareBuildMetrics(build1, build2) {
  return {
    nextjsSize: compareSizes(build1.nextjsSize, build2.nextjsSize, 'Next.js build size'),
    nestjsSize: compareSizes(build1.nestjsSize, build2.nestjsSize, 'NestJS build size'),
    pages: compareNumbers(build1.pages, build2.pages, 'Total pages', false),
    buildTime: compareNumbers(build1.buildTime, build2.buildTime, 'Build time', true),
  }
}

function compareTestMetrics(tests1, tests2) {
  return {
    coverage: {
      lines: comparePercentages(tests1.jest.coverage.lines, tests2.jest.coverage.lines, 'Line coverage'),
      statements: comparePercentages(
        tests1.jest.coverage.statements,
        tests2.jest.coverage.statements,
        'Statement coverage',
      ),
      functions: comparePercentages(
        tests1.jest.coverage.functions,
        tests2.jest.coverage.functions,
        'Function coverage',
      ),
      branches: comparePercentages(tests1.jest.coverage.branches, tests2.jest.coverage.branches, 'Branch coverage'),
    },
    testFiles: {
      jest: compareNumbers(tests1.jest.testFiles, tests2.jest.testFiles, 'Jest test files', false),
      playwright: compareNumbers(
        tests1.playwright.testFiles,
        tests2.playwright.testFiles,
        'Playwright test files',
        false,
      ),
    },
  }
}

function compareBundleMetrics(bundle1, bundle2) {
  return {
    totalDependencies: compareNumbers(
      bundle1.totalDependencies,
      bundle2.totalDependencies,
      'Total dependencies',
      false,
    ),
    largestChunks: compareChunks(bundle1.largestChunks, bundle2.largestChunks),
  }
}

function compareCodeMetrics(code1, code2) {
  return {
    totalFiles: compareNumbers(code1.totalFiles, code2.totalFiles, 'Total files', false),
    typeScriptFiles: compareNumbers(code1.typeScriptFiles, code2.typeScriptFiles, 'TypeScript files', false),
    reactComponents: compareNumbers(code1.reactComponents, code2.reactComponents, 'React components', false),
    testFiles: compareNumbers(code1.testFiles, code2.testFiles, 'Test files', false),
    pages: compareNumbers(code1.pages, code2.pages, 'Page files', false),
    components: compareNumbers(code1.components, code2.components, 'Component files', false),
  }
}

function compareSizes(size1, size2, label) {
  const delta = size2 - size1
  const percentChange = size1 > 0 ? ((delta / size1) * 100).toFixed(2) : 0

  return {
    label,
    before: size1,
    after: size2,
    delta,
    percentChange: parseFloat(percentChange),
    improvement: delta < 0, // Smaller is better
    formatted: {
      before: formatBytes(size1),
      after: formatBytes(size2),
      delta: (delta > 0 ? '+' : '') + formatBytes(Math.abs(delta)),
    },
  }
}

function compareNumbers(num1, num2, label, lowerIsBetter = true) {
  const delta = num2 - num1
  const percentChange = num1 > 0 ? ((delta / num1) * 100).toFixed(2) : 0

  return {
    label,
    before: num1,
    after: num2,
    delta,
    percentChange: parseFloat(percentChange),
    improvement: lowerIsBetter ? delta < 0 : delta > 0,
    formatted: {
      before: String(num1),
      after: String(num2),
      delta: (delta > 0 ? '+' : '') + delta,
    },
  }
}

function comparePercentages(pct1, pct2, label) {
  const delta = pct2 - pct1

  return {
    label,
    before: pct1,
    after: pct2,
    delta,
    improvement: delta > 0, // Higher is better for percentages
    formatted: {
      before: pct1.toFixed(1) + '%',
      after: pct2.toFixed(1) + '%',
      delta: (delta > 0 ? '+' : '') + delta.toFixed(1) + '%',
    },
  }
}

function compareChunks(chunks1, chunks2) {
  // Create a map of chunk names to sizes for easy comparison
  const map1 = new Map(chunks1.map((c) => [c.name, c.size]))
  const map2 = new Map(chunks2.map((c) => [c.name, c.size]))

  const allChunkNames = new Set([...map1.keys(), ...map2.keys()])

  const comparisons = Array.from(allChunkNames)
    .map((name) => {
      const size1 = map1.get(name) || 0
      const size2 = map2.get(name) || 0
      const delta = size2 - size1

      return {
        name,
        size1,
        size2,
        delta,
        improvement: delta < 0,
        formatted: {
          before: formatBytes(size1),
          after: formatBytes(size2),
          delta: (delta > 0 ? '+' : '') + formatBytes(Math.abs(delta)),
        },
      }
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 10) // Top 10 changed chunks

  return comparisons
}

function printComparison(comparison) {
  console.log('═'.repeat(70))
  console.log('📊 DETAILED COMPARISON')
  console.log('═'.repeat(70))

  // Build metrics
  console.log('\n🏗️  Build Performance:')
  printMetric(comparison.build.nextjsSize)
  printMetric(comparison.build.nestjsSize)
  printMetric(comparison.build.pages)

  // Test coverage
  console.log('\n📊 Test Coverage:')
  printMetric(comparison.tests.coverage.lines)
  printMetric(comparison.tests.coverage.statements)
  printMetric(comparison.tests.coverage.functions)
  printMetric(comparison.tests.coverage.branches)

  // Test files
  console.log('\n🧪 Test Files:')
  printMetric(comparison.tests.testFiles.jest)
  printMetric(comparison.tests.testFiles.playwright)

  // Code metrics
  console.log('\n📝 Code Metrics:')
  printMetric(comparison.code.totalFiles)
  printMetric(comparison.code.typeScriptFiles)
  printMetric(comparison.code.reactComponents)
  printMetric(comparison.code.testFiles)
  if (comparison.code.pages?.before) printMetric(comparison.code.pages)
  if (comparison.code.components?.before) printMetric(comparison.code.components)

  // Bundle metrics
  console.log('\n📦 Bundle Analysis:')
  printMetric(comparison.bundle.totalDependencies)

  if (comparison.bundle.largestChunks.length > 0) {
    console.log('\n   Top Changed Chunks:')
    comparison.bundle.largestChunks.slice(0, 5).forEach((chunk) => {
      const icon = getChangeIcon(chunk.improvement, chunk.delta === 0)
      const color = getChangeColor(chunk.improvement, chunk.delta === 0)
      console.log(
        `   ${icon} ${chunk.name}: ${chunk.formatted.before} → ${chunk.formatted.after} (${color}${chunk.formatted.delta}${colors.reset})`,
      )
    })
  }

  console.log('\n' + '═'.repeat(70))
}

function printMetric(metric) {
  if (!metric || metric.before === undefined) return

  const icon = getChangeIcon(metric.improvement, metric.delta === 0)
  const color = getChangeColor(metric.improvement, metric.delta === 0)

  console.log(
    `   ${icon} ${metric.label}: ${metric.formatted.before} → ${metric.formatted.after} (${color}${metric.formatted.delta}${colors.reset})`,
  )
}

function getChangeIcon(improvement, noChange) {
  if (noChange) return '➡️ '
  return improvement ? '✅' : '⚠️ '
}

function getChangeColor(improvement, noChange) {
  if (noChange) return colors.dim
  return improvement ? colors.green : colors.red
}

function printSummary(comparison) {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║                    SUMMARY                                ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  const improvements = []
  const regressions = []
  const noChanges = []

  // Count all metrics
  const allMetrics = [
    comparison.build.nextjsSize,
    comparison.build.nestjsSize,
    comparison.tests.coverage.lines,
    comparison.tests.coverage.statements,
    comparison.tests.coverage.functions,
    comparison.tests.coverage.branches,
    comparison.code.totalFiles,
    comparison.bundle.totalDependencies,
  ]

  allMetrics.forEach((metric) => {
    if (metric.delta === 0) {
      noChanges.push(metric)
    } else if (metric.improvement) {
      improvements.push(metric)
    } else {
      regressions.push(metric)
    }
  })

  console.log(`${colors.green}✅ Improvements: ${improvements.length}${colors.reset}`)
  if (improvements.length > 0) {
    improvements.slice(0, 5).forEach((m) => {
      console.log(`   • ${m.label}: ${m.formatted.delta}`)
    })
  }

  console.log(`\n${colors.red}⚠️  Regressions: ${regressions.length}${colors.reset}`)
  if (regressions.length > 0) {
    regressions.slice(0, 5).forEach((m) => {
      console.log(`   • ${m.label}: ${m.formatted.delta}`)
    })
  }

  console.log(`\n${colors.dim}➡️  No changes: ${noChanges.length}${colors.reset}`)

  // Overall verdict
  console.log('\n' + '─'.repeat(70))

  const improvementScore = improvements.length - regressions.length

  if (improvementScore > 3) {
    console.log(`\n${colors.green}🎉 Excellent! Significant improvements detected.${colors.reset}`)
  } else if (improvementScore > 0) {
    console.log(`\n${colors.green}👍 Good progress. Some metrics improved.${colors.reset}`)
  } else if (improvementScore === 0) {
    console.log(`\n${colors.yellow}⚖️  Neutral. Improvements balanced with regressions.${colors.reset}`)
  } else {
    console.log(`\n${colors.red}⚠️  Caution. More regressions than improvements.${colors.reset}`)
  }

  console.log()
}

function saveComparisonReport(comparison, metrics1, metrics2) {
  const reportsDir = path.join(process.cwd(), 'metrics', 'reports')

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().split('T')[0]
  const fileName = `comparison-${timestamp}.json`
  const filePath = path.join(reportsDir, fileName)

  const report = {
    timestamp: new Date().toISOString(),
    baseline1: {
      date: metrics1.date,
      timestamp: metrics1.timestamp,
    },
    baseline2: {
      date: metrics2.date,
      timestamp: metrics2.timestamp,
    },
    comparison,
  }

  fs.writeFileSync(filePath, JSON.stringify(report, null, 2))

  console.log(`📄 Comparison report saved to: ${filePath}\n`)
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function printHelp() {
  console.log(`
Usage: npm run measure:compare <baseline1> <baseline2>

Compare two baseline metric files to identify improvements and regressions.

Arguments:
  baseline1   First baseline file (older)
  baseline2   Second baseline file (newer)

Files can be specified as:
  - Full path: /path/to/baseline-2026-02-16.json
  - Relative path: metrics/baseline-2026-02-16.json
  - Filename: baseline-2026-02-16.json
  - Date: 2026-02-16 (will look for baseline-2026-02-16.json)

Examples:
  npm run measure:compare baseline-2026-02-15.json baseline-2026-02-16.json
  npm run measure:compare 2026-02-15 2026-02-16

The script will automatically search in the metrics/ directory.
`)
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h') || args.length < 2) {
    printHelp()
    process.exit(args.length < 2 ? 1 : 0)
  }

  const [baseline1, baseline2] = args

  compareMetrics(baseline1, baseline2)
}

module.exports = { compareMetrics }
