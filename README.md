# Lighthouse Tracker


Run Lighthouse against your website, parse the JSON result for only those metrics that are useful, and return the result. From there you can **track whether your key metrics are improving (or not).** 

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

This returns a **Promise** with data in the form below. It's up to you how you want to store/display that data.

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
]
```


## Example (simple)

### 1. Create a runner file

Create a simple node file that will read the URL from 

```js
// lighthouse-runner.js

const lighthouse = require('lighthouse-tracker')

// Post to your favourite data store
const saveData = data => {
  // Save data here to a database, Datadog etc
  console.log(data)
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

We run this against a staging site which requires authentication — we recommend [`cross-var`](https://github.com/elijahmanor/cross-var) for this e.g. assuming you have `AUTH_USER` and `AUTH_PASSWORD` in a `.env` file…

```json
// package.json
{
  "scripts": {
    "lighthouse": "export $(grep -v '^#' .env | xargs) && cross-var node ./lighthouse-runner.js https://$AUTH_USER:$AUTH_PASSWORD@staging.welcometothejungle.com",
  }
}
```

Because we run this against different sites via CircleCI, we need to 

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