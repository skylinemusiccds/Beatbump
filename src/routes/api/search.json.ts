import { parseSearchResult } from '$lib/parsers'
import { searchManager } from '$lib/stores/stores'

export async function get({ query }) {
	const q = query.get('q') || ''
	const params = query.get('params') || ''
	const endpoint = query.get('endpoint') || ''
	const videoId = query.get('videoId') || ''
	const playlistId = query.get('playlistId') || ''
	const ctoken = query.get('ctoken') || ''
	const browseId = query.get('browseId') || ''
	// console.log(endpoint)
	const pageType = query.get('pt') || ''
	const index = query.get('index') || ''

	const gl = query.get('gl') || ''

	try {
		const response = await fetch(
			`https://music.youtube.com/youtubei/v1/search?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30${
				ctoken !== '' ? '' : `&sp=EgWKAQIIAWoKEAoQAxAEEAUQCQ%3D%3D`
			}${
				ctoken !== ''
					? `&ctoken=${ctoken}&continuation=${ctoken}&itct=${params}&type='next'`
					: ''
			}`,
			{
				method: 'POST',
				body: JSON.stringify({
					context: {
						client: {
							clientName: 'WEB_REMIX',
							clientVersion: '0.1',
							deviceMake: 'google',
							platform: 'DESKTOP',
							deviceModel: 'bot',
							experimentIds: [],
							experimentsToken: '',
							osName: 'Googlebot',
							osVersion: '2.1',
							locationInfo: {
								locationPermissionAuthorizationStatus:
									'LOCATION_PERMISSION_AUTHORIZATION_STATUS_UNSUPPORTED'
							},
							musicAppInfo: {
								musicActivityMasterSwitch:
									'MUSIC_ACTIVITY_MASTER_SWITCH_INDETERMINATE',
								musicLocationMasterSwitch:
									'MUSIC_LOCATION_MASTER_SWITCH_INDETERMINATE',
								pwaInstallabilityStatus: 'PWA_INSTALLABILITY_STATUS_UNKNOWN'
							},
							utcOffsetMinutes: -new Date().getTimezoneOffset()
						},
						capabilities: {},
						request: {
							internalExperimentFlags: [
								{
									key: 'force_music_enable_outertube_tastebuilder_browse',
									value: 'true'
								},
								{
									key: 'force_music_enable_outertube_playlist_detail_browse',
									value: 'true'
								},
								{
									key: 'force_music_enable_outertube_search_suggestions',
									value: 'true'
								}
							],
							sessionIndex: {}
						},
						user: {
							enableSafetyMode: false
						},
						activePlayers: {}
					},
					browseEndpointContextMusicConfig: {
						browseEndpointContextMusicConfig: {
							pageType: `${pageType}`
						}
					},
					browseId: `${browseId}`,

					isAudioOnly: true,
					query: `${q}`,

					params: `${params}`,
					videoId: `${videoId}`,
					playlistId: `${playlistId}`
				}),
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					Origin: 'https://music.youtube.com',
					'User-Agent':
						'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
				}
			}
		)

		if (!response.ok) {
			// NOT res.status >= 200 && res.status < 300
			return { statusCode: response.status, body: response.statusText }
		}
		const data = await response.json()

		let contents
		if (data.hasOwnProperty('continuationContents')) {
			contents = data.continuationContents
			let results = await parseSearchResult(contents, true)

			// console.log(`contents: `, results);

			return {
				statusCode: 200,
				body: JSON.stringify(results)
			}
		} else {
			let {
				contents: {
					sectionListRenderer: {
						contents: [...rest]
					}
				}
			} = data

			let results = await parseSearchResult(rest, false)
			if (results?.error) {
				console.log(results?.error)
				return { error: results?.error }
			}

			return {
				statusCode: 200,
				body: JSON.stringify(results)
			}
			return results
		}
	} catch (error) {
		// output to netlify function log
		console.log(error)
		return {
			statusCode: 500,
			// Could be a custom message or object i.e. JSON.stringify(err)
			body: JSON.stringify({ msg: error.message })
		}
	}
}