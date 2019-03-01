# Lighthouse Tracker


Run [Lighthouse](https://developers.google.com/web/tools/lighthouse/) against your website, parse the JSON result for only those metrics that are useful, and return the result. From there you can **track whether your key metrics are improving (or not).** 

## Motivation

You can read about the thinking behind this here: but basically, we wanted a way to run Lighthouse against our site whenever we released a build via CircleCI.

## Installation

Either `npm`:

```
npm install lighthouse-tracker
```

Or `yarn`:

```
yarn add lighthouse-tracker
```

## Commands

### `lighthouse.run(url)` 

This returns a **Promise** with data in the format below. It's up to you how you want to store/display that data e.g. save to a database, `POST` to a service like Datadog.

```json
[
  {
    "date": "2019-03-01T07:57:59.368Z",
    "url": "https://anucreative.com/",
    "id": "first-contentful-paint",
    "title": "First Contentful Paint",
    "rawValue": 1118.575,
    "displayValue": "1.1 s",
    "score": 1
  },
  {
    "date": "2019-03-01T07:57:59.368Z",
    "url": "https://anucreative.com/",
    "id": "first-meaningful-paint",
    "title": "First Meaningful Paint",
    "rawValue": 1251.874,
    "displayValue": "1.3 s",
    "score": 1
  },
  {
    "date": "2019-03-01T07:57:59.368Z",
    "url": "https://anucreative.com/",
    "id": "speed-index",
    "title": "Speed Index",
    "rawValue": 1655,
    "displayValue": "1.7 s",
    "score": 1
  }
  ...
]
```

It currently returns the following metrics:

```json
[
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
```


## Example (simple)

### 1. Create a runner file

```js
// lighthouse-runner.js

const lighthouse = require('lighthouse-tracker')

const saveData = data => {
  // Post to your favourite data store
}

// Run
lighthouse
  .run("https://welcometothejungle.com")
  .then(saveData)
  .catch(console.error)
```

### 2. Run your file from `npm` scripts

```json
// package.json

{
  "scripts": {
    "lighthouse": "node ./lighthouse-runner.js",
  }
}
```


## Example (more involved)

### 1. Create a runner file that will read the URL from the command line arguments

```js
// lighthouse-runner.js

const path = require('path')
const dogapi = require('dogapi')
const lighthouse = require('lighthouse-tracker')
const parseArgs = require('minimist')

require('dotenv')

// Get URL from arguments
const argv = parseArgs(process.argv.slice(2))
const url = argv._[0]
if (!url) {
  throw Error('No URL provided')
}

// Post to Datadog
const postToDataDog = metrics => {
  dogapi.initialize({
    api_key: process.env.DATA_DOG_API_KEY,
    app_key: process.env.DATA_DOG_APP_KEY
  })
  return dogapi.metric.send_all(metrics, (err, res) => {
    if (err) {
      throw new Error(err)
    }
    console.dir(res)
  })
}

// Run
lighthouse
  .run(url)
  .then(postToDataDog)
  .catch(console.error)

```

### 2. Set up the `npm` task (same as first example)

```json
// package.json

{
  "scripts": {
    "lighthouse": "node ./lighthouse-runner.js",
  }
}
```

### 3. Call the `lighthouse` `npm` task from Circle with a URL

```yml
// .circleci/config.yml

jobs: 
  lighthouse:
    steps:
      - run: yarn lighthouse https://$AUTH_USER:$AUTH_PASSWORD@staging.welcometothejungle.com
      - store_artifacts:
          path: reports/lighthouse 
```


## Todo
- Tests
- Accept more Lighthouse arguments (e.g. throttle, list of metrics)
- Multiple passes taking median results