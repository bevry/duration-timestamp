import { equal, deepEqual, errorEqual } from 'assert-helpers'
import kava from 'kava'
import {
	Format,
	secondsInHour,
	secondsInMinute,
	parse,
	replace,
	stringify,
	Timestamp,
} from './index.js'

const extractTests: Array<
	| { input: string; result: Timestamp; error?: undefined }
	| { input: string; result?: undefined; error: string }
> = [
	{
		input: '00',
		error: 'capture group',
	},
	{
		input: '0',
		error: 'capture group',
	},
	{
		input: '00:00',
		result: {
			total: 0,
			seconds: 0,
			minutes: 0,
			hours: 0,
		},
	},
	{
		input: '0:0',
		result: {
			total: 0,
			seconds: 0,
			minutes: 0,
			hours: 0,
		},
	},
	{
		input: '00:00:00',
		result: {
			total: 0,
			seconds: 0,
			minutes: 0,
			hours: 0,
		},
	},
	{
		input: '0:0:0',
		result: {
			total: 0,
			seconds: 0,
			minutes: 0,
			hours: 0,
		},
	},
	{
		input: '2:3',
		result: {
			total: 3 + 2 * secondsInMinute,
			seconds: 3,
			minutes: 2,
			hours: 0,
		},
	},
	{
		input: '22:33',
		result: {
			total: 33 + 22 * secondsInMinute,
			seconds: 33,
			minutes: 22,
			hours: 0,
		},
	},
	{
		input: '1:2:3',
		result: {
			total: 3 + 2 * secondsInMinute + secondsInHour,
			seconds: 3,
			minutes: 2,
			hours: 1,
		},
	},
	{
		input: '11:22:33',
		result: {
			total: 33 + 22 * secondsInMinute + 11 * secondsInHour,
			seconds: 33,
			minutes: 22,
			hours: 11,
		},
	},
	{
		input: '0s',
		result: {
			total: 0,
			seconds: 0,
			minutes: 0,
			hours: 0,
		},
	},
	{
		input: '0m',
		result: {
			total: 0,
			seconds: 0,
			minutes: 0,
			hours: 0,
		},
	},
	{
		input: '0h',
		result: {
			total: 0,
			seconds: 0,
			minutes: 0,
			hours: 0,
		},
	},
	{
		input: '3s',
		result: {
			total: 3,
			seconds: 3,
			minutes: 0,
			hours: 0,
		},
	},
	{
		input: '2m',
		result: {
			total: 2 * secondsInMinute,
			seconds: 0,
			minutes: 2,
			hours: 0,
		},
	},
	{
		input: '1h',
		result: {
			total: secondsInHour,
			seconds: 0,
			minutes: 0,
			hours: 1,
		},
	},
	{
		input: '1h 3s',
		result: {
			total: 3 + secondsInHour,
			seconds: 3,
			minutes: 0,
			hours: 1,
		},
	},
	{
		input: '2m 3s',
		result: {
			total: 3 + 2 * secondsInMinute,
			seconds: 3,
			minutes: 2,
			hours: 0,
		},
	},
	{
		input: '1h2m3s',
		result: {
			total: 3 + 2 * secondsInMinute + secondsInHour,
			seconds: 3,
			minutes: 2,
			hours: 1,
		},
	},
	{
		input: '1h 2m 3s',
		result: {
			total: 3 + 2 * secondsInMinute + secondsInHour,
			seconds: 3,
			minutes: 2,
			hours: 1,
		},
	},
	{
		input: '11h 22m 33s',
		result: {
			total: 33 + 22 * secondsInMinute + 11 * secondsInHour,
			seconds: 33,
			minutes: 22,
			hours: 11,
		},
	},
]

const formatTests = [
	{
		input: null,
		formats: {
			[Format.Numeric]: null,
			[Format.Seconds]: null,
			[Format.Tiny]: null,
			[Format.Short]: null,
			[Format.Medium]: null,
			[Format.Long]: null,
		},
	},
	{
		input: {
			total: 0,
		},
		formats: {
			[Format.Numeric]: '0:00',
			[Format.Seconds]: '0s',
			[Format.Tiny]: '0s',
			[Format.Short]: '00s',
			[Format.Medium]: '0 secs',
			[Format.Long]: '0 seconds',
		},
	},
	{
		input: {
			total: 0,
			seconds: 0,
		},
		formats: {
			[Format.Numeric]: '0:00',
			[Format.Seconds]: '0s',
			[Format.Tiny]: '0s',
			[Format.Short]: '00s',
			[Format.Medium]: '0 secs',
			[Format.Long]: '0 seconds',
		},
	},
	{
		input: {
			total: 0,
			minutes: 0,
		},
		formats: {
			[Format.Numeric]: '0:00',
			[Format.Seconds]: '0s',
			[Format.Tiny]: '0s',
			[Format.Short]: '00s',
			[Format.Medium]: '0 secs',
			[Format.Long]: '0 seconds',
		},
	},
	{
		input: {
			total: 0,
			hours: 0,
		},
		formats: {
			[Format.Numeric]: '0:00',
			[Format.Seconds]: '0s',
			[Format.Tiny]: '0s',
			[Format.Short]: '00s',
			[Format.Medium]: '0 secs',
			[Format.Long]: '0 seconds',
		},
	},
	{
		input: {
			total: 1,
			seconds: 1,
		},
		formats: {
			[Format.Numeric]: '0:01',
			[Format.Seconds]: '1s',
			[Format.Tiny]: '1s',
			[Format.Short]: '1s',
			[Format.Medium]: '1 secs',
			[Format.Long]: '1 seconds',
		},
	},
	{
		input: {
			total: 1 + secondsInMinute,
			seconds: 1,
			minutes: 1,
		},
		formats: {
			[Format.Numeric]: '1:01',
			[Format.Seconds]: '61s',
			[Format.Tiny]: '1m1s',
			[Format.Short]: '1m 1s',
			[Format.Medium]: '1 mins 1 secs',
			[Format.Long]: '1 minutes 1 seconds',
		},
	},
	{
		input: {
			total: 1 + secondsInMinute + secondsInHour,
			seconds: 1,
			minutes: 1,
			hours: 1,
		},
		formats: {
			[Format.Numeric]: '1:01:01',
			[Format.Seconds]: '3661s',
			[Format.Tiny]: '1h1m1s',
			[Format.Short]: '1h 1m 1s',
			[Format.Medium]: '1 hours 1 mins 1 secs',
			[Format.Long]: '1 hours 1 minutes 1 seconds',
		},
	},
	{
		input: {
			total: secondsInHour,
			hours: 1,
		},
		formats: {
			[Format.Numeric]: '1:00:00',
			[Format.Seconds]: '3600s',
			[Format.Tiny]: '1h',
			[Format.Short]: '1h',
			[Format.Medium]: '1 hours',
			[Format.Long]: '1 hours',
		},
	},
	{
		input: {
			total: secondsInMinute,
			minutes: 1,
		},
		formats: {
			[Format.Numeric]: '1:00',
			[Format.Seconds]: '60s',
			[Format.Tiny]: '1m',
			[Format.Short]: '1m',
			[Format.Medium]: '1 mins',
			[Format.Long]: '1 minutes',
		},
	},
]

const replaceTest = {
	input: `
00 01 0:0 1:0 1:2
0:0:0 1:0:0 1:2:3
0:00
00s
01s
00m 00s
00 minutes 00 seconds
0 minutes 0 seconds
1 minute 1 second
00 hours 00 minutes 00 seconds
01 hours 02 minutes 03 secs
01 hours 02 minutes
02 mins`,
	replaceResult: `
00 01 {"hours":0,"minutes":0,"seconds":0,"total":0} {"hours":0,"minutes":1,"seconds":0,"total":60} {"hours":0,"minutes":1,"seconds":2,"total":62}
{"hours":0,"minutes":0,"seconds":0,"total":0} {"hours":1,"minutes":0,"seconds":0,"total":3600} {"hours":1,"minutes":2,"seconds":3,"total":3723}
{"hours":0,"minutes":0,"seconds":0,"total":0}
{"hours":0,"minutes":0,"seconds":0,"total":0}
{"hours":0,"minutes":0,"seconds":1,"total":1}
{"hours":0,"minutes":0,"seconds":0,"total":0}
{"hours":0,"minutes":0,"seconds":0,"total":0}
{"hours":0,"minutes":0,"seconds":0,"total":0}
{"hours":0,"minutes":1,"seconds":1,"total":61}
{"hours":0,"minutes":0,"seconds":0,"total":0}
{"hours":1,"minutes":2,"seconds":3,"total":3723}
{"hours":1,"minutes":2,"seconds":0,"total":3720}
{"hours":0,"minutes":2,"seconds":0,"total":120}`,
	stringifyResult: `
00 01 [00s] [1m] [1m 2s]
[00s] [1h] [1h 2m 3s]
[00s]
[00s]
[1s]
[00s]
[00s]
[00s]
[1m 1s]
[00s]
[1h 2m 3s]
[1h 2m]
[2m]`,
}

kava.suite('duration-timestamp', function (suite, test) {
	suite('extraction', function (suite, test) {
		extractTests.forEach(function (value) {
			test(value.input, function () {
				try {
					deepEqual(
						parse(value.input),
						value.result,
						'result from extraction was as expected'
					)
				} catch (err) {
					if (value.error) {
						errorEqual(err, value.error)
					} else {
						throw err
					}
				}
			})
		})
	})
	suite('formats', function (suite, test) {
		formatTests.forEach(function (value) {
			suite(JSON.stringify(value.input), function (suite, test) {
				for (const format of Object.keys(value.formats)) {
					const expected = value.formats[format as Format]
					test(format, function () {
						try {
							equal(
								// @ts-ignore for testing
								stringify(value.input, format as Format),
								expected,
								'stringify result was as expected'
							)
						} catch (err) {
							if (expected != null) {
								throw err
							}
						}
					})
				}
			})
		})
	})
	test('replace', function () {
		equal(
			replace(replaceTest.input, function (timestamp) {
				return JSON.stringify(timestamp)
			}),
			replaceTest.replaceResult
		)
	})
	test('stringify', function () {
		equal(
			replace(replaceTest.input, function (timestamp) {
				return `[${stringify(timestamp)}]`
			}),
			replaceTest.stringifyResult
		)
	})
})
