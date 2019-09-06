# Sharp memory experiment
## Usage
Run `npm i` first of all, and then run either:

1. `npm run test` - to run a specific test;
2. `npm run test-all` - to run a series of preconfigured tests.

## Multiple test runner

The `npm run test-all` command accepts a list of test names. **Test name** can be one of:

 - **composite** - a full example that I use in production, which involves resizing, extracting and extending multiple images, converting them to buffers via `toBuffer()`, compositing them on top of each other and saving them to a PNG file.
 - **single** - performs resize, extract and extend on a _single_ image, and saves it to a PNG file, thus no buffers involved.
 - **simpleToFile** - reads a file and writes it to a new file without _any_ modifications.
 - **simpleToBuffer** - reads a file and calls the `toBuffer()` method on the sharp object. Does nothing with the buffer after that.

### How it works

The multiple test runner:

1) launches 10 identical sharp operations simultaneously (these operations can be one of either the _composite_, _single_, _simpleToFile_ or _simpleToBuffer_ type);
2) waits until all of these 10 operations finish;
3) records the RSS;
4) repeats until either the RSS is recorded 100 times or it reaches the 2GB mark.
5) once that happens, it records the results to a CSV file under the **results** subdirectory. The name of the file will be `<testName>-10-<concurrency>-<caching>`, e.g. `simpleToFile-10-0-true` would hold the results of many simpleToFile operations run with the default concurrency settings and caching enabled.

This whole thing is repeated 4 times with different concurrency and caching settings:

1) concurrency is on, caching is off;
2) concurrency is on, caching is on;
3) concurrency is off, caching is off;
4) concurrency is off, caching is on.

### Example

`npm run test-all single simpleToBuffer` - will run test suites for **single** and **simpleToBuffer** tests

## Single test runner

The `npm run test` command accepts the following positional arguments:

`npm run test <test-name> <concurrecnt-ops> <concurrency> <cache>`

This starts running certain sharp operations (depends on the chosen test name) and prints execution time and memory usage after each test run.

Once you interrupt the operation (Ctrl+C), it writes the results it collected so far to a file named `<testName>-<concurrent-ops>-<concurrency>-<caching>`, e.g. `composite-20-1-false` would hold the results of the composite operation run many times in chunks of 20 with concurrency set to 1 and caching disabled (see below for the explanation of the parameters).

### Parameters

**test-name** indicates the test to be run, i.e. _single_, _composite_, _simpleToFile_ or _simpleToBuffer_.

**concurrent-ops** indicates the number of operations to launch *at once*. If you choose **1**, then a single test run will run the chosen operation (i.e. composite, single, simpleToFile or simpleToBuffer) once and wait until it's finished before running again. If you choose **20**, then 20 parallel operations of the same type will be launched at once and the test will halt until *all* of them have finished before running again.

**concurrency** indicates the number used with `sharp.concurrency()`. Default is **0**.

If you provide the word **false** for the **cache** parameter, then sharp caching will be turned off (`sharp.cache(false)`). Otherwise, it stays enabled by default.

### Examples

`npm run test single 25 0` - runs chunks of 25 **single** operations per test with default sharp concurrency and cache settings.

`npm run test simpleToBuffer 1 1 false` - runs **simpleToBuffer** operation one by one with `sharp.concurrency(1)` and `sharp.cache(false)`.

## Different memory allocator

To run the tests with a different memory allocator, try this:

`LD_PRELOAD=<path-to-allocator-lib> npm run test ...`

For testing purposes I have included `libjemalloc.so.1` in the repository. Be careful when using it on your system!

## Notes

Each operation results in a new image file. These files are created under subdirectories named after the test that was run. These subdirectories are cleared before each `npm run test`.