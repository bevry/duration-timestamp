import { equal, deepEqual } from 'assert-helpers'
import kava from 'kava'
import {
	secondsInHour,
	secondsInMinute,
	extractTimestamp,
	replaceTimestamps,
} from './index.js'

const extractTests = [
	{
		input: '00',
		result: null,
	},
	{
		input: '0',
		result: null,
	},
	{
		input: '00:00',
		result: {
			total: 0,
			seconds: 0,
			minutes: 0,
		},
	},
	{
		input: '0:0',
		result: {
			total: 0,
			seconds: 0,
			minutes: 0,
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
		},
	},
	{
		input: '22:33',
		result: {
			total: 33 + 22 * secondsInMinute,
			seconds: 33,
			minutes: 22,
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
		},
	},
	{
		input: '0m',
		result: {
			total: 0,
			minutes: 0,
		},
	},
	{
		input: '0h',
		result: {
			total: 0,
			hours: 0,
		},
	},
	{
		input: '3s',
		result: {
			total: 3,
			seconds: 3,
		},
	},
	{
		input: '2m',
		result: {
			total: 2 * secondsInMinute,
			minutes: 2,
		},
	},
	{
		input: '1h',
		result: {
			total: secondsInHour,
			hours: 1,
		},
	},
	{
		input: '1h 3s',
		result: {
			total: 3 + secondsInHour,
			seconds: 3,
			hours: 1,
		},
	},
	{
		input: '2m 3s',
		result: {
			total: 3 + 2 * secondsInMinute,
			seconds: 3,
			minutes: 2,
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

const replaceTest = {
	input: `
00 01 0:0 1:0 1:2
0:0:0 1:0:0 1:2:3
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
	result: `
00 01 {"total":0,"minutes":0,"seconds":0} {"total":60,"minutes":1,"seconds":0} {"total":62,"minutes":1,"seconds":2}
{"total":0,"hours":0,"minutes":0,"seconds":0} {"total":3600,"hours":1,"minutes":0,"seconds":0} {"total":3723,"hours":1,"minutes":2,"seconds":3}
{"total":0,"seconds":0}
{"total":1,"seconds":1}
{"total":0,"minutes":0,"seconds":0}
{"total":0,"minutes":0,"seconds":0}
{"total":0,"minutes":0,"seconds":0}
{"total":61,"minutes":1,"seconds":1}
{"total":0,"hours":0,"minutes":0,"seconds":0}
{"total":3723,"hours":1,"minutes":2,"seconds":3}
{"total":3720,"hours":1,"minutes":2}
{"total":120,"minutes":2}`,
}

kava.suite('extract-timestamp', function (suite, test) {
	suite('extraction', function (suite, test) {
		extractTests.forEach(function (value) {
			test(value.input, function () {
				deepEqual(
					extractTimestamp(value.input),
					value.result,
					'result from extraction was as expected'
				)
			})
		})
	})
	test('replace', function () {
		equal(
			replaceTimestamps(replaceTest.input, function (timestamp) {
				return JSON.stringify(timestamp)
			}),
			replaceTest.result
		)
	})
})
