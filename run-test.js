const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const generate = require("./generatePrintFile");

if (process.argv.length < 3) {
  throw new Error(
    "Please indicate which test you'd like to execute: single, composite, simpleToFile or simpleToBuffer"
  );
}

const testName = process.argv[2];

if (testName !== "single" && testName !== "composite" && testName !== "simpleToFile" && testName !== "simpleToBuffer") {
  throw new Error("No such test available! Available tests are: single, composite, simpleToFile or simpleToBuffer");
}

const concurrentOps = process.argv.length > 3 ? parseInt(process.argv[3]) : 1;

const concurrency = process.argv.length > 4 ? parseInt(process.argv[4]) : 0;

sharp.concurrency(concurrency);

const disableCache = process.argv.length > 5 && process.argv[5] === "false";

sharp.cache(!disableCache);

console.log(
  "Will run test '" + testName + "' with " + concurrentOps + " concurrent operation" + (concurrentOps > 1 ? "s" : "")
);

console.log("Sharp concurrency is " + concurrency + ", sharp cache is " + (disableCache ? "disabled" : "enabled"));

if (!fs.existsSync(testName)) {
  fs.mkdirSync(testName);
}

console.log("Clearing the test directory...");
const files = fs.readdirSync(testName);
for (const file of files) {
  fs.unlinkSync(path.join(testName, file), err => {
    if (err) throw err;
  });
}
console.log("Directory cleared!");

const getRSS = () => Math.round(process.memoryUsage().rss / 1000000);

let runCounter = 1;

let maxMemoryUsed = 0;

const runTest = () => {
  const promises = [];
  let localCounter = 1;
  for (let i = 0; i < concurrentOps; i++) {
    promises.push(generate[testName](testName, runCounter + "-" + localCounter++));
  }
  return Promise.all(promises);
};

const run = () => {
  console.log("Starting run #" + runCounter);
  const startTime = Date.now();
  runTest()
    .then(() => {
      const memoryUsed = getRSS();
      maxMemoryUsed = Math.max(memoryUsed, maxMemoryUsed);
      console.log(
        "Run #" +
          runCounter +
          " is complete. Execution time: " +
          (Date.now() - startTime) / 1000 +
          "s. Current memory usage: " +
          memoryUsed +
          "MB"
      );
      runCounter++;
      setTimeout(run, 100);
    })
    .catch(err => {
      console.log(err);
      process.exit(1);
    });
};

console.log("Current memory usage: " + getRSS() + "MB");

console.log("Will start running the test in 2s...");

setTimeout(run, 2000);
