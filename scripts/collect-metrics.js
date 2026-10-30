#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * Collects comprehensive metrics for the codebase
 * Aggregates build stats, test coverage, and code metrics
 */

function collectMetrics() {
  console.log('📊 Collecting codebase metrics...\n')

  const metrics = {
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    build: collectBuildMetrics(),
    tests: collectTestMetrics(),
    bundle: collectBundleMetrics(),
    code: collectCodeMetrics(),
  }

  return metrics
}

/**
 * Collect build-related metrics
 */
function collectBuildMetrics() {
  console.log('📦 Collecting build metrics...')

  const metrics = {
    nextjsSize: 0,
    nestjsSize: 0,
    buildTime: 0,
    firstLoadJS: {},
  }

  try {
    // Get Next.js build size
    const nextDir = path.join(process.cwd(), '.next')
    if (fs.existsSync(nextDir)) {
      metrics.nextjsSize = getDirectorySize(nextDir)
      console.log(`  ✓ Next.js build size: ${formatBytes(metrics.nextjsSize)}`)
    }

    // Get NestJS build size
    const distDir = path.join(process.cwd(), 'dist')
    if (fs.existsSync(distDir)) {
      metrics.nestjsSize = getDirectorySize(distDir)
      console.log(`  ✓ NestJS build size: ${formatBytes(metrics.nestjsSize)}`)
    }

    // Parse build manifest for page sizes
    const buildManifestPath = path.join(nextDir, 'build-manifest.json')
    if (fs.existsSync(buildManifestPath)) {
      const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'))
      metrics.pages = Object.keys(buildManifest.pages || {}).length
      console.log(`  ✓ Total pages: ${metrics.pages}`)
    }

    // Parse Next.js build output for first load JS
    const nextMetaPath = path.join(nextDir, 'next-server.js.nft.json')
    if (fs.existsSync(nextMetaPath)) {
      // Parse the NFT (Node File Trace) data
      const nftData = JSON.parse(fs.readFileSync(nextMetaPath, 'utf8'))
      metrics.nftFiles = nftData.files?.length || 0
    }
  } catch (error) {
    console.log(`  ⚠ Error collecting build metrics: ${error.message}`)
  }

  console.log()
  return metrics
}

/**
 * Collect test-related metrics
 */
function collectTestMetrics() {
  console.log('🧪 Collecting test metrics...')

  const metrics = {
    jest: {
      total: 0,
      passed: 0,
      failed: 0,
      coverage: {
        lines: 0,
        statements: 0,
        functions: 0,
        branches: 0,
      },
    },
    playwright: {
      total: 0,
      passed: 0,
      failed: 0,
      duration: 0,
    },
  }

  try {
    // Parse Jest coverage
    const coverageSummaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json')
    if (fs.existsSync(coverageSummaryPath)) {
      const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'))
      const total = coverageData.total || {}

      metrics.jest.coverage = {
        lines: total.lines?.pct || 0,
        statements: total.statements?.pct || 0,
        functions: total.functions?.pct || 0,
        branches: total.branches?.pct || 0,
      }

      console.log(`  ✓ Jest coverage: ${metrics.jest.coverage.lines.toFixed(1)}% lines`)
    } else {
      console.log('  ⚠ No Jest coverage data found. Run "npm run test:cov" first.')
    }

    // Count test files
    const testDir = path.join(process.cwd(), 'src', 'tests')
    if (fs.existsSync(testDir)) {
      const testFiles = getAllFiles(testDir, '.spec.ts')
      metrics.jest.testFiles = testFiles.length
      console.log(`  ✓ Jest test files: ${testFiles.length}`)
    }

    // Count Playwright test files
    const uiTestDir = path.join(testDir, 'ui')
    if (fs.existsSync(uiTestDir)) {
      const playwrightFiles = getAllFiles(uiTestDir, '.spec.ts')
      metrics.playwright.testFiles = playwrightFiles.length
      console.log(`  ✓ Playwright test files: ${playwrightFiles.length}`)
    }
  } catch (error) {
    console.log(`  ⚠ Error collecting test metrics: ${error.message}`)
  }

  console.log()
  return metrics
}

/**
 * Collect bundle analysis metrics
 */
function collectBundleMetrics() {
  console.log('📦 Collecting bundle metrics...')

  const metrics = {
    largestChunks: [],
    dependencies: {},
  }

  try {
    // Try to read package-lock.json or pnpm-lock.yaml for dependency analysis
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
      metrics.totalDependencies = Object.keys(deps).length
      console.log(`  ✓ Total dependencies: ${metrics.totalDependencies}`)

      // Store major dependencies
      const majorDeps = ['react', 'react-dom', 'next', '@nestjs/core', '@nestjs/common']
      majorDeps.forEach((dep) => {
        if (deps[dep]) {
          metrics.dependencies[dep] = deps[dep]
        }
      })
    }

    // Check for static chunks in .next/static/chunks
    const chunksDir = path.join(process.cwd(), '.next', 'static', 'chunks')
    if (fs.existsSync(chunksDir)) {
      const chunks = fs.readdirSync(chunksDir)
      const chunkSizes = chunks
        .filter((file) => file.endsWith('.js'))
        .map((file) => {
          const filePath = path.join(chunksDir, file)
          const stats = fs.statSync(filePath)
          return { name: file, size: stats.size }
        })
        .sort((a, b) => b.size - a.size)
        .slice(0, 10)

      metrics.largestChunks = chunkSizes
      console.log(`  ✓ Analyzed ${chunks.length} chunks`)
    }
  } catch (error) {
    console.log(`  ⚠ Error collecting bundle metrics: ${error.message}`)
  }

  console.log()
  return metrics
}

/**
 * Collect code metrics (LOC, file counts, etc.)
 */
function collectCodeMetrics() {
  console.log('📝 Collecting code metrics...')

  const metrics = {
    totalFiles: 0,
    typeScriptFiles: 0,
    javaScriptFiles: 0,
    reactComponents: 0,
    testFiles: 0,
  }

  try {
    const srcDir = path.join(process.cwd(), 'src')

    if (fs.existsSync(srcDir)) {
      const allFiles = getAllFiles(srcDir)
      metrics.totalFiles = allFiles.length

      metrics.typeScriptFiles = allFiles.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx')).length
      metrics.javaScriptFiles = allFiles.filter((f) => f.endsWith('.js') || f.endsWith('.jsx')).length
      metrics.reactComponents = allFiles.filter((f) => f.endsWith('.tsx') || f.endsWith('.jsx')).length
      metrics.testFiles = allFiles.filter((f) => f.includes('.spec.') || f.includes('.test.')).length

      console.log(`  ✓ Total files in src/: ${metrics.totalFiles}`)
      console.log(`  ✓ TypeScript files: ${metrics.typeScriptFiles}`)
      console.log(`  ✓ React components: ${metrics.reactComponents}`)
      console.log(`  ✓ Test files: ${metrics.testFiles}`)
    }

    // Count pages
    const pagesDir = path.join(srcDir, 'pages')
    if (fs.existsSync(pagesDir)) {
      const pageFiles = getAllFiles(pagesDir, '.tsx')
      metrics.pages = pageFiles.length
      console.log(`  ✓ Page files: ${metrics.pages}`)
    }

    // Count components
    const componentsDir = path.join(srcDir, 'components')
    if (fs.existsSync(componentsDir)) {
      const componentFiles = getAllFiles(componentsDir, '.tsx')
      metrics.components = componentFiles.length
      console.log(`  ✓ Component files: ${metrics.components}`)
    }
  } catch (error) {
    console.log(`  ⚠ Error collecting code metrics: ${error.message}`)
  }

  console.log()
  return metrics
}

/**
 * Utility: Get directory size recursively
 */
function getDirectorySize(dirPath) {
  let size = 0

  try {
    const files = fs.readdirSync(dirPath)

    for (const file of files) {
      const filePath = path.join(dirPath, file)
      const stats = fs.statSync(filePath)

      if (stats.isDirectory()) {
        size += getDirectorySize(filePath)
      } else {
        size += stats.size
      }
    }
  } catch (error) {
    // Ignore errors (permission denied, etc.)
  }

  return size
}

/**
 * Utility: Get all files recursively in a directory
 */
function getAllFiles(dirPath, extension = '') {
  let files = []

  try {
    const entries = fs.readdirSync(dirPath)

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry)
      const stats = fs.statSync(fullPath)

      if (stats.isDirectory()) {
        files = files.concat(getAllFiles(fullPath, extension))
      } else if (!extension || fullPath.endsWith(extension)) {
        files.push(fullPath)
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return files
}

/**
 * Utility: Format bytes to human-readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Save metrics to JSON file
 */
function saveMetrics(metrics) {
  const metricsDir = path.join(process.cwd(), 'metrics')

  // Create metrics directory if it doesn't exist
  if (!fs.existsSync(metricsDir)) {
    fs.mkdirSync(metricsDir, { recursive: true })
  }

  const fileName = `baseline-${metrics.date}.json`
  const filePath = path.join(metricsDir, fileName)

  fs.writeFileSync(filePath, JSON.stringify(metrics, null, 2))

  console.log(`\n✅ Metrics saved to: ${filePath}\n`)
  return filePath
}

/**
 * Print summary
 */
function printSummary(metrics) {
  console.log('='.repeat(60))
  console.log('📊 BASELINE METRICS SUMMARY')
  console.log('='.repeat(60))
  console.log()

  console.log('Build Performance:')
  console.log(`  - Next.js build: ${formatBytes(metrics.build.nextjsSize)}`)
  console.log(`  - NestJS build: ${formatBytes(metrics.build.nestjsSize)}`)
  console.log(`  - Total pages: ${metrics.build.pages || 'N/A'}`)
  console.log()

  console.log('Test Coverage:')
  console.log(`  - Lines: ${metrics.tests.jest.coverage.lines.toFixed(1)}%`)
  console.log(`  - Statements: ${metrics.tests.jest.coverage.statements.toFixed(1)}%`)
  console.log(`  - Functions: ${metrics.tests.jest.coverage.functions.toFixed(1)}%`)
  console.log(`  - Branches: ${metrics.tests.jest.coverage.branches.toFixed(1)}%`)
  console.log()

  console.log('Code Metrics:')
  console.log(`  - Total files: ${metrics.code.totalFiles}`)
  console.log(`  - TypeScript files: ${metrics.code.typeScriptFiles}`)
  console.log(`  - React components: ${metrics.code.reactComponents}`)
  console.log(`  - Test files: ${metrics.code.testFiles}`)
  console.log()

  console.log('Bundle:')
  console.log(`  - Total dependencies: ${metrics.bundle.totalDependencies}`)
  if (metrics.bundle.largestChunks.length > 0) {
    console.log(`  - Largest chunks:`)
    metrics.bundle.largestChunks.slice(0, 5).forEach((chunk) => {
      console.log(`    • ${chunk.name}: ${formatBytes(chunk.size)}`)
    })
  }
  console.log()
  console.log('='.repeat(60))
}

// Main execution
if (require.main === module) {
  const metrics = collectMetrics()
  const filePath = saveMetrics(metrics)
  printSummary(metrics)

  console.log('💡 Next steps:')
  console.log('  1. Review the metrics in:', path.relative(process.cwd(), filePath))
  console.log('  2. Make your refactoring changes')
  console.log('  3. Run "npm run measure:compare" to see improvements')
  console.log()
}

module.exports = { collectMetrics, saveMetrics }
