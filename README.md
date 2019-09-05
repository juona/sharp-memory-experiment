# Sharp memory experiment
## Usage
Run `npm i` and then `npm run test`. This command accepts the following positional arguments:

`npm run test <test-name> <concurrecnt-ops> <concurrency> <cache>`

This starts running certain sharp operations (depends on the chosen test name) and prints execution time and memory usage after each test run. This makes it easy to see how the RSS memory consumption is increasing without a clear limit when using buffers.

### Parameters

**Test name** can be one of:

 - **composite** - a full example that I use in production, which involves resizing and cropping/extending multiple images, converting them to buffers, compositing them on top of each other and saving them to a PNG file.
 - **single** - performing the same operations on a single image, thus no composition/buffers involved.
 - **simpleToFile** - reads a file and writes it to a new file without modifications.
 - **simpleToBuffer** - reads a file and calls the `toBuffer()` method on the sharp object. Does nothing with the buffer.

**Concurrent ops** indicates the number of operations to launch *at once*. If you choose **1**, then a single test run will run the chosen operation (i.e. composite, single, simpleToFile or simpleToBuffer) once and wait until it's finished before running again. If you choose 20, then 20 parallel operations of the same type will be launched at once and the test will halt until *all* of them are finished before running again.

**Concurrency** indicates the number used with `sharp.concurrency()`.

If you provide the word **false** for the **cache** parameter, then sharp caching will be turned off (`sharp.cache(false)`).

## Examples

`npm run test single 25 0` - runs chunks of 25 **single** operations per test with default sharp concurrency and cache settings.

`npm run test simpleToBuffer 1 1 false` - runs **simpleToBuffer** operation one by one with `sharp.concurrency(1)` and `sharp.cache(false)`.

## Different memory allocator

To run the tests with a different memory allocator, try this:

`LD_OVERLOAD=<path-to-allocator-lib> npm run test ...`

For testing purposes I have included `libjemalloc.so.1` in the repository. Be careful when using it on your system!

## Notes

Each operation results in a new image file. These files are created under subdirectories named after the test that was run. These subdirectories are cleared before each `npm run test`.