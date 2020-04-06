/** The regular expression used for finding a timestamp */
const timestampsRegex = /(?:(?:(?<hours>\d{1,2}):)?(?<minutes>\d{1,2}):(?<seconds>\d{1,2})|(?<bits>(?:\d{1,2}(?:[hms]| ?(?:hour|min(?:ute)?|sec(?:ond)?)s?) ?)+))/

/** The regular expression used for extracting a timestmap in 1h2m3s format */
const timestampRegex = /^(?:(?<hours>\d{1,2})(?:h|\s?hours?)\s?)?(?:(?<minutes>\d{1,2})(?:m|\s?min(?:ute)?s?)\s?)?(?:(?<seconds>\d{1,2})(?:s|\s?sec(?:ond)?s?)\s?)?$/

export const secondsInMinute = 60
export const minutesInHour = 60
export const secondsInHour = secondsInMinute * minutesInHour

/** Timestamp object */
export interface Timestamp {
	/** Total number of seconds, including from hours and minutes */
	total: number
	/** Seconds excluding hours and minutes */
	seconds?: number
	/** Minutes excluding hours */
	minutes?: number
	/** Hours */
	hours?: number
}

/** Turn a timestamp object into a string */
export function stringifyTimestamp({
	total,
	hours,
	minutes,
	seconds,
}: Timestamp): string {
	if (total) {
		const parts = []
		if (Number(hours)) parts.push(`${hours}h`)
		if (Number(minutes)) parts.push(`${minutes}m`)
		if (Number(seconds)) parts.push(`${seconds}s`)
		return parts.join(' ') || '00s'
	}
	return ''
}

/** Make a timestamp object from hours, minutes, and seconds */
export function makeTimestamp(
	hours?: string | number,
	minutes?: string | number,
	seconds?: string | number
) {
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
	suffix: string = ''
) {
	const text = stringifyTimestamp(timestamp)
	if (text) {
		const url = `https://www.youtube.com/watch?v=${youtubeID}&t=${timestamp.total}s`
		return `<a href="${url}" title="View the video ${youtubeID} at ${text}">${text}</a>${suffix}`
	}
	return text
}

/** Extract the first youtube video identifier that is found within an element */
export function extractYoutubeID(el: HTMLElement): string {
	// prepare
	let youtubeID, child

	// href is first
	// as https://discuss.bevry.me/t/maps-of-meaning-9/31 links to the topic video
	// but embeds the discussion video
	child = el.querySelector('[href^="https://www.youtube.com/watch?v="]')
	const href = child && child.getAttribute('href')
	if (href) {
		const url = new URL(href)
		youtubeID = url.searchParams.get('v')
		if (youtubeID) return youtubeID
	}

	// player
	child = el.querySelector('[data-youtube-id]')
	youtubeID = child && child.getAttribute('data-youtube-id')
	if (youtubeID) return youtubeID

	// embed
	child = el.querySelector('[src^="https://www.youtube.com/embed/"]')
	const src = child && child.getAttribute('src')
	if (src) {
		const url = new URL(src)
		youtubeID = url.pathname.substring(7)
		if (youtubeID) return youtubeID
	}

	// debug
	// console.log('this:', $this.html())
	return ''
}
