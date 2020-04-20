/** The regular expression used for finding a timestamp */
const timestampsRegex = /(?:(?:(?<hours>\d{1,2}):)?(?<minutes>\d{1,2}):(?<seconds>\d{1,2})|(?<bits>(?:\d{1,2}(?:[hms]| ?(?:hour|min(?:ute)?|sec(?:ond)?)s?) ?)+))/

/** The regular expression used for extracting a timestmap in 1h2m3s format */
const timestampRegex = /^(?:(?<hours>\d{1,2})(?:h|\s?hours?)\s?)?(?:(?<minutes>\d{1,2})(?:m|\s?min(?:ute)?s?)\s?)?(?:(?<seconds>\d{1,2})(?:s|\s?sec(?:ond)?s?)\s?)?$/

export const secondsInMinute = 60
export const minutesInHour = 60
export const secondsInHour = secondsInMinute * minutesInHour

/** Timestamp object */
export interface Timestamp {
	/**
	 * Total number of seconds, including from hours and minutes.
	 */
	total: number
	/**
	 * Seconds excluding hours and minutes.
	 * Will not exist if the seconds were not provided.
	 */
	seconds?: number
	/**
	 * Minutes excluding hours.
	 * Will not exist if the minutes were not provided.
	 */
	minutes?: number
	/**
	 * Hours.
	 * Will not exist if the hours were not provided.
	 */
	hours?: number
}

/**
 * Checks whether any of the timestamp's `hours`, `minutes`, and `seconds` has a value >= 0.
 * @returns `true` if there was a value, otherwise `false`.
 */
export function verifyTimestamp(
	timestamp: { hours?: any; minutes?: any; seconds?: any } | null
): boolean {
	if (timestamp == null) return false
	const { hours, minutes, seconds } = timestamp
	if (hours == null && minutes == null && seconds == null) return false
	return true
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
 * @returns `null` if invalid, `00s` if empty, otherwise the timestamp in `Hh Mm Ss` format
 */
export function stringifyTimestamp(
	timestamp: Timestamp | null,
	format: Format = Format.Short
): string | null {
	if (verifyTimestamp(timestamp) === false) return null
	const { total, hours, minutes, seconds } = timestamp as Timestamp
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
			throw new Error('stringifyTimestamp: invalid format')
	}
}

/**
 * Make a timestamp object from hours, minutes, and seconds.
 * Will return an empty object, if the timestamp
 */
export function makeTimestamp(
	hours?: string | number,
	minutes?: string | number,
	seconds?: string | number
): Timestamp | null {
	if (verifyTimestamp({ hours, minutes, seconds }) === false) return null
	const timestamp: Timestamp = { total: 0 }
	if (hours != null) {
		timestamp.hours = Number(hours)
		timestamp.total += timestamp.hours * secondsInHour
	}
	if (minutes != null) {
		timestamp.minutes = Number(minutes)
		timestamp.total += timestamp.minutes * secondsInMinute
	}
	if (seconds != null) {
		timestamp.seconds = Number(seconds)
		timestamp.total += timestamp.seconds
	}
	return timestamp
}

function extractTimestampFromGroup(
	groups?: {
		[key: string]: string
	} | null
): Timestamp | null {
	if (!groups) return null

	// 1h2m3s format
	if (groups.bits) {
		const bitsMatch = groups.bits.match(timestampRegex)
		if (!bitsMatch || !bitsMatch.groups) return null
		return makeTimestamp(
			bitsMatch.groups.hours,
			bitsMatch.groups.minutes,
			bitsMatch.groups.seconds
		)
	}

	// 00:00:00 format
	return makeTimestamp(groups.hours, groups.minutes, groups.seconds)
}

/** Extract the timestamp out of a string */
export function extractTimestamp(input: string): Timestamp | null {
	const match = input.match(timestampsRegex)
	return extractTimestampFromGroup(match && match.groups)
}

/**
 * Replace timestamp occurences within a string with the results of a replacer function
 * @example
 * ``` javascript
 * import {replaceTimestamps, youtubeTimestamp} from 'extract-timestamp'
 * const result = replaceTimestamps(html, function(timestamp) {
 * 	return youtubeTimestamp(timestamp, youtubeID, ' —')
 * }, ' [-—]')
 * ```
 * @param input The string to replace the timestmaps within
 * @param replacer A method that takes in the timestamp object and should return a string to replace the timestamp text with
 * @param suffix An optional suffix to append to the regular expression for limiting what the timestamp regex can match (e.g. use ` [-—]` to only match timestamps suffixed by ` -` or ` —`)
 */
export function replaceTimestamps(
	input: string,
	replacer: (timestamp: Timestamp | null) => string,
	suffix: string = ''
) {
	const regex = new RegExp(timestampsRegex.source + suffix, 'g')
	return input.replace(regex, function (match, ...args) {
		const timestamp = extractTimestampFromGroup(args[args.length - 1])

		// check we have what we need
		const text = replacer(timestamp)
		if (text) {
			console.log('replaced:', text)
			return text
		}

		// fallback
		console.log('fallback:', match)
		return match
	})
}

/** Make a HTML link for a youtube video to commence at a timestamp */
export function makeYoutubeTimestamp(
	timestamp: Timestamp,
	youtubeID: string,
	suffix: string = '',
	format?: Format
) {
	const text = stringifyTimestamp(timestamp, format)
	if (text) {
		const url = `https://www.youtube.com/watch?v=${youtubeID}&t=${stringifyTimestamp(
			timestamp,
			Format.Tiny
		)}`
		return `<a href="${url}" title="View the video ${youtubeID} at ${text}">${text}</a>${suffix}`
	}
	return text
}

/** The selectors we use to identify a YouTube video. */
const selectors = {
	// href is first
	// as https://discuss.bevry.me/t/maps-of-meaning-9/31 links to the topic video
	// but embeds the discussion video
	href: '[href^="https://www.youtube.com/watch?v="]:not(.youtube-timetamp)',
	shortHref: '[href^="https://youtu.be/"]',
	embedHref: '[href^="https://www.youtube.com/embed/"]',
	player: '[data-youtube-id]',
	embed: '[src^="https://www.youtube.com/embed/"]',
}

/** The regular expression used to fetch the YouTube Video ID from a YouTube Embed Link */
const embedHrefRegex = /^.+?\/embed\/([^/]+?)([/?]+.*)?/

/** The selector that aggregates all the earlier selectors */
const selectorAll = Array.from(Object.values(selectors)).join(', ')

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
	for (const child of el.querySelectorAll(selectorAll)) {
		// href
		if (matches(child, selectors.href)) {
			const href = child.getAttribute('href')
			if (href) {
				const url = new URL(href)
				const youtubeID = url.searchParams.get('v')
				if (youtubeID) return youtubeID
			}
		}

		// short href
		if (matches(child, selectors.shortHref)) {
			const href = child.getAttribute('href')
			if (href) {
				const url = new URL(href)
				const youtubeID = url.pathname.split('/')[1]
				if (youtubeID) return youtubeID
			}
		}

		// embed href
		if (matches(child, selectors.embedHref)) {
			const href = child.getAttribute('href')
			if (href) {
				const youtubeID = href.replace(embedHrefRegex, '$1')
				if (youtubeID) return youtubeID
			}
		}

		// player
		if (matches(child, selectors.player)) {
			const youtubeID = child.getAttribute('data-youtube-id')
			if (youtubeID) return youtubeID
		}

		// embed
		if (matches(child, selectors.embed)) {
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
