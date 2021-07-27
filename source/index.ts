/** The regular expression used for finding a timestamp */
const timestampsRegex =
	/(?:(?:(?<hours>\d{1,2}):)?(?<minutes>\d{1,2}):(?<seconds>\d{1,2})|(?<bits>(?:\d{1,2}(?:[hms]| ?(?:hour|min(?:ute)?|sec(?:ond)?)s?) ?)+))/

/** The regular expression used for extracting a timestmap in 1h2m3s format */
const timestampRegex =
	/^(?:(?<hours>\d{1,2})(?:h|\s?hours?)\s?)?(?:(?<minutes>\d{1,2})(?:m|\s?min(?:ute)?s?)\s?)?(?:(?<seconds>\d{1,2})(?:s|\s?sec(?:ond)?s?)\s?)?$/

export const secondsInMinute = 60
export const minutesInHour = 60
export const secondsInHour = secondsInMinute * minutesInHour

/** Valid timestamp as returned from {@link make} */
export interface Timestamp {
	/**
	 * Total number of seconds, including from hours and minutes.
	 */
	total: number
	/**
	 * Seconds excluding hours and minutes..
	 */
	seconds: number
	/**
	 * Minutes excluding hours.
	 */
	minutes: number
	/**
	 * Hours.
	 */
	hours: number
}

/** Possibly invalid timestamp sent to our functions */
export type TimestampInput = Partial<Timestamp>

/** Calculate the total seconds */
export function sum(timestamp: TimestampInput): number {
	return (
		(timestamp.seconds ?? 0) +
		(timestamp.minutes ?? 0) * secondsInMinute +
		(timestamp.hours ?? 0) * secondsInHour
	)
}

/** Verify the total is the sum */
export function verify(timestamp: TimestampInput): void {
	if (timestamp.total !== sum(timestamp))
		throw new Error('timestamp total did not match the sum')
}

/** Helper to determine hours in minutes, and minutes in seconds (yes in that order) */
function mod(
	value: number = 0,
	mod: number
): { whole: number; remainder: number } {
	const remainder = value % mod
	const whole = Math.floor(value / mod)
	return { remainder, whole }
}

/** Make a new valid timestamp from a potentially invalid one */
export function make(timestamp: TimestampInput): Timestamp {
	// if we have a total, use that
	if (timestamp.total) {
		// prepare
		if (!timestamp.seconds) timestamp.seconds = 0
		if (!timestamp.minutes) timestamp.minutes = 0
		if (!timestamp.hours) timestamp.hours = 0
		// verify
		if (timestamp.seconds || timestamp.minutes || timestamp.hours) {
			verify(timestamp)
			return timestamp as Timestamp
		}
		// calculate the parts from the total
		{
			const { whole, remainder } = mod(timestamp.total, secondsInHour)
			timestamp.hours = whole
			timestamp.minutes = remainder
		}
		{
			const { whole, remainder } = mod(
				timestamp.minutes * secondsInMinute,
				secondsInMinute
			)
			timestamp.minutes = whole
			timestamp.seconds = remainder
		}
		verify(timestamp)
		return timestamp as Timestamp
	}
	// otherwise, use the parts we have
	if (timestamp.seconds) {
		const { whole, remainder } = mod(timestamp.seconds, secondsInMinute)
		timestamp.minutes = (timestamp.minutes || 0) + whole
		timestamp.seconds = remainder
	} else {
		timestamp.seconds = 0
	}
	if (timestamp.minutes) {
		const { whole, remainder } = mod(timestamp.minutes, minutesInHour)
		timestamp.hours = (timestamp.hours || 0) + whole
		timestamp.minutes = remainder
	} else {
		timestamp.minutes = 0
	}
	if (!timestamp.hours) {
		timestamp.hours = 0
	}
	timestamp.total = sum(timestamp)
	return timestamp as Timestamp
}

/** The timestamp stringify formats available to us */
export enum Format {
	Numeric = '00:00:00',
	Seconds = '0s',
	Tiny = '0h0m0s',
	Short = '0h 0m 0s',
	Medium = '0 hours 0 mins 0 secs',
	Long = '0 hours 0 minutes 0 seconds',
}

/** Pad a value for output in 00:00:00 format */
function pad(value?: string | number): string {
	if (!value) return '00'
	if (value < 10) return '0' + String(value)
	return String(value)
}

/**
 * Turn a timestamp object into a string.
 * @returns an empty string if invalid, `00s` if empty, otherwise the timestamp in `Hh Mm Ss` format
 */
export function stringify(
	timestamp: Timestamp,
	format: Format = Format.Short
): string {
	verify(timestamp)
	const { total, hours, minutes, seconds } = timestamp
	const parts = []
	switch (format) {
		case Format.Short:
			if (Number(hours)) parts.push(`${hours}h`)
			if (Number(minutes)) parts.push(`${minutes}m`)
			if (Number(seconds)) parts.push(`${seconds}s`)
			return parts.join(' ') || '00s'
		case Format.Tiny:
			if (Number(hours)) parts.push(`${hours}h`)
			if (Number(minutes)) parts.push(`${minutes}m`)
			if (Number(seconds)) parts.push(`${seconds}s`)
			return parts.join('') || '0s'
		case Format.Medium:
			if (Number(hours)) parts.push(`${hours} hours`)
			if (Number(minutes)) parts.push(`${minutes} mins`)
			if (Number(seconds)) parts.push(`${seconds} secs`)
			return parts.join(' ') || '0 secs'
		case Format.Long:
			if (Number(hours)) parts.push(`${hours} hours`)
			if (Number(minutes)) parts.push(`${minutes} minutes`)
			if (Number(seconds)) parts.push(`${seconds} seconds`)
			return parts.join(' ') || '0 seconds'
		case Format.Numeric:
			if (Number(hours)) {
				parts.push(hours, pad(minutes), pad(seconds))
			} else {
				parts.push(minutes || '0', pad(seconds))
			}
			return parts.join(':')
		case Format.Seconds:
			return String(total) + 's'
		default:
			throw new Error('stringify: invalid format')
	}
}

/**
 * Parse the regular expression capture groups from our regex
 */
function parseCaptureGroups(
	groups?: {
		[key: string]: string
	} | null
): Timestamp {
	if (!groups) throw new Error('no capture groups')

	// 1h2m3s format
	if (groups.bits) {
		const bitsMatch = groups.bits.match(timestampRegex)
		if (!bitsMatch || !bitsMatch.groups)
			throw new Error('no bits capture group')
		return make({
			hours: Number(bitsMatch.groups.hours || 0),
			minutes: Number(bitsMatch.groups.minutes || 0),
			seconds: Number(bitsMatch.groups.seconds || 0),
		})
	}

	// 00:00:00 format
	return make({
		hours: Number(groups.hours || 0),
		minutes: Number(groups.minutes || 0),
		seconds: Number(groups.seconds || 0),
	})
}

/** Options to parse to {@link regex} */
export interface RegexOptions {
	prefix?: string
	suffix?: string
	flags?: string
}

/** Generate the parsing regex */
export function regex(opts: RegexOptions = {}): RegExp {
	if (opts.prefix || opts.suffix || opts.flags) {
		return new RegExp(
			(opts.prefix ?? '') + timestampsRegex.source + (opts.suffix ?? ''),
			opts.flags ?? ''
		)
	} else {
		return timestampsRegex
	}
}

/** Extract the timestamp out of a string */
export function parse(input: string, opts?: RegexOptions): Timestamp {
	const match = input.match(regex(opts))
	return parseCaptureGroups(match && match.groups)
}

/** Alias for {@link parse} */
export const extract = parse

/**
 * Replace timestamp occurences within a string with the results of a replacer function
 * @example
 * ``` javascript
 * import {replaceTimestamps, youtubeTimestamp} from 'duration-timestamp'
 * const result = replaceTimestamps(html, function(timestamp) {
 * 	return youtubeTimestamp(timestamp, youtubeID, ' —')
 * }, ' [-—]')
 * ```
 * @param input The string to replace the timestmaps within
 * @param replacer A method that takes in the timestamp object and should return a string to replace the timestamp text with, also receives the match
 * @param suffix An optional suffix to append to the regular expression for limiting what the timestamp regex can match (e.g. use ` [-—]` to only match timestamps suffixed by ` -` or ` —`)
 */
export function replace(
	input: string,
	replacer: (
		timestamp: Timestamp,
		match: string
	) => string | null | undefined | void,
	opts: RegexOptions = {}
) {
	if (opts.flags == null) opts.flags = 'g'
	return input.replace(regex(opts), function (match, ...args) {
		const timestamp = parseCaptureGroups(args[args.length - 1])
		// check if timestamp extraction was successful
		if (timestamp) {
			// check we have what we need
			const text = replacer(timestamp, match)
			if (text != null) return text
		}
		return match
	})
}

/** Format options for {@link makeYoutubeTimestamp} */
export interface FormatOptions {
	prefix?: string
	suffix?: string
	format?: Format
	text?: string
}

/** Make a HTML link for a youtube video to commence at a timestamp */
export function makeYoutubeTimestamp(
	timestamp: Timestamp,
	youtubeID: string,
	opts: FormatOptions = {}
) {
	const text = opts.text || stringify(timestamp, opts.format)
	if (text) {
		const t = stringify(timestamp, Format.Tiny)
		const title = stringify(timestamp, Format.Long)
		const url = `https://www.youtube.com/watch?v=${youtubeID}&t=${t}`
		return `${opts.prefix || ''}<a class="youtube-timetamp" data-total="${
			timestamp.total
		}" href="${url}" title="View the video ${youtubeID} at ${title}">${text}</a>${
			opts.suffix || ''
		}`
	}
	return text
}

/** The regular expression used to fetch the YouTube Video ID from a YouTube Embed Link */
const embedHrefRegex = /^.+?\/embed\/([^/]+?)([/?]+.*)?/

/** The selectors we use to identify a YouTube video */
const videoSelectors = {
	// href is first
	// as https://discuss.bevry.me/t/maps-of-meaning-9/31 links to the topic video
	// but embeds the discussion video
	href: '[href^="https://www.youtube.com/watch"]:not(.youtube-timetamp)',
	shortHref: '[href^="https://youtu.be/"]',
	embedHref: '[href^="https://www.youtube.com/embed/"]',
	player: '[data-youtube-id]',
	embed: '[src^="https://www.youtube.com/embed/"]',
}

/** The selector that aggregates all the earlier selectors */
const videoSelector = Array.from(Object.values(videoSelectors)).join(', ')

/** The selectors we use to identify a playist */
const playlistSelectors = {
	video: '[href^="https://www.youtube.com/watch"]',
	direct: '[href^="https://www.youtube.com/playlist"]',
	embed: '[src^="https://www.youtube.com/embed/"]',
}

/** The selector that aggregates all the earlier selectors */
const playlistSelector = Array.from(Object.values(playlistSelectors)).join(', ')

/**
 * Check if the element is a selector.
 * http://youmightnotneedjquery.com/#matches_selector
 */
function matches(el: Element, selector: string) {
	return (
		el.matches ||
		(el as any).matchesSelector ||
		(el as any).msMatchesSelector ||
		(el as any).mozMatchesSelector ||
		el.webkitMatchesSelector ||
		(el as any).oMatchesSelector
	).call(el, selector)
}

/** Extract the first youtube video identifier that is found within an element */
export function extractYoutubeID(el: HTMLElement): string {
	// fetch
	for (const child of el.querySelectorAll(videoSelector)) {
		// href
		if (matches(child, videoSelectors.href)) {
			const href = child.getAttribute('href')
			if (href) {
				const url = new URL(href)
				const youtubeID = url.searchParams.get('v')
				if (youtubeID) return youtubeID
			}
		}

		// short href
		if (matches(child, videoSelectors.shortHref)) {
			const href = child.getAttribute('href')
			if (href) {
				const url = new URL(href)
				const youtubeID = url.pathname.split('/')[1]
				if (youtubeID) return youtubeID
			}
		}

		// embed href
		if (matches(child, videoSelectors.embedHref)) {
			const href = child.getAttribute('href')
			if (href) {
				const youtubeID = href.replace(embedHrefRegex, '$1')
				if (youtubeID) return youtubeID
			}
		}

		// player
		if (matches(child, videoSelectors.player)) {
			const youtubeID = child.getAttribute('data-youtube-id')
			if (youtubeID) return youtubeID
		}

		// embed
		if (matches(child, videoSelectors.embed)) {
			const src = child.getAttribute('src')
			if (src) {
				const url = new URL(src)
				const youtubeID = url.pathname.substring(7)
				if (youtubeID) return youtubeID
			}
		}
	}

	// debug
	// console.log('this:', $this.html())
	return ''
}

/** Extract the first youtube playlist identifier that is found within an element */
export function extractYoutubePlaylistID(el: HTMLElement): string {
	// fetch
	for (const child of el.querySelectorAll(playlistSelector)) {
		const value = child.getAttribute('href') || child.getAttribute('src')
		if (value) {
			const url = new URL(value)
			const youtubeID = url.searchParams.get('list')
			if (youtubeID) return youtubeID
		}
	}

	// debug
	// console.log('this:', $this.html())
	return ''
}
