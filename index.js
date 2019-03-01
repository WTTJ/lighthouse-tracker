const fs = require('fs')
const jq = require('node-jq')
const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const formatDate = require('date-fns').format

// Get attributes required
const ATTRIBUTES_TO_POST = [
  'first-contentful-paint',
  'first-meaningful-paint',
  'speed-index',
  'network-requests',
  'interactive',
  'total-byte-weight',
  'uses-webp-images',
  'uses-optimized-images',
  'uses-responsive-images'
]

// Settings
const opts = {
  chromeFlags: ['--headless', '--disable-gpu']
}
const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance'],
    skipAudits: ['critical-request-chains', 'final-screenshot', 'screenshot-thumbnails']
  }
}

// Run Chrome and Lighthouse
const launchChromeAndRunLighthouse = (url, opts, config = null) => {
  return chromeLauncher.launch({ chromeFlags: opts.chromeFlags }).then(chrome => {
    opts.port = chrome.port
    return lighthouse(url, opts, config)
      .then(results => chrome.kill().then(() => results))
      .catch(e => chrome.kill())
  })
}

const timestamp = formatDate(Date.now(), 'YYYY-MM-DD_HH-mm-ss_SSS')

// Write original file
const writeFile = results => {
  fs.writeFileSync(`reports/lighthouse/lighthouse.${timestamp}.result.json`, results.report)
  return results.lhr
}

// Write parsed file
const writeParsedFile = parsed => {
  fs.writeFileSync(`reports/lighthouse/lighthouse.${timestamp}.parsed.json`, parsed)
  return JSON.parse(parsed)
}

// Read Lighthouse report and parse content
const parseJSON = results => {
  results.i18n = null
  results.timing = null
  const filter =
    '. as { $fetchTime, $finalUrl } | [{ date: $fetchTime, url: $finalUrl, id: "performance", title: "Performance", score: .categories.performance.score }, .audits] | [.[0], .[1][] | { date: $fetchTime, url: $finalUrl, id, title, rawValue, displayValue, score }]'
  return jq.run(filter, results, { input: 'json', output: 'string' })
}

// Pull out just the metrics we want
const filterMetrics = metrics => {
  return metrics.reduce((acc, item) => {
    if (ATTRIBUTES_TO_POST.includes(item.id)) {
      acc.push(item)
    }
    return acc
  }, [])
}

// Run everything
const run = url => {
  if (!url) {
    throw Error('No URL provided')
  }

  console.log('Running Lighthouse report for', url)

  return launchChromeAndRunLighthouse(url, opts, config)
    .then(writeFile)
    .then(parseJSON)
    .then(writeParsedFile)
    .then(filterMetrics)
    .catch(console.error)
}

module.exports = {
  run
}
