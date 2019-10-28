///////////////////////////////////////////////////////////////////
//// Name:         err.js
//// Description:  Module for handling all potential errors thrown
////               within dayjob.
////               
//// Version:      0.0.1
//// Author:       Simon Metcalfe
///////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////
//// Error array
///////////////////////////////////////////////////////////////////

errors = new Array(          // Error code                        // Error title                       // Error description                                                                   // Action code          // Action CTA
                   new Array('no_client_id',                      'Check Spotify connection',          'Can\'t connect to Spotify without a client ID and secret',                            'check_api_connection', 'Open Spotify connection settings'),
                   new Array('no_authorisation_code',             'Check Spotify connection',          'dayjob needs authorising with Spotify.',                                              'authorise_dayjob',     'Launch auth URL'),
                   new Array('cannot_refresh_access_token',       'Error talking to Spotify',          'Couldn\'t refresh access token.  Might be an internet issue, try again',              'no_action',             ''),
                   new Array('cannot_get_users_details',          'Error talking to Spotify',          'Couldn\'t get the users details.  Might be an internet issue, try again',             'no_action',             ''),
                   new Array('cannot_get_auth_url',               'Error talking to Spotify',          'Couldn\'t get the authorisation URL.  Might be an internet issue, try again',         'no_action',             ''),
                   new Array('cannot_get_playing_track_info',     'Error talking to Spotify',          'Couldn\'t get info on the playing track.  Might be an internet issue, try again',     'no_action',             ''),
                   new Array('cannot_get_track_context',          'Error talking to Spotify',          'Couldn\'t get track context.  Might be an internet issue, try again',                 'no_action',             ''),
                   new Array('cannot_get_playlist_name',          'Error talking to Spotify',          'Couldn\'t  get playlist  name.  Might be an internet issue, try again',               'no_action',             ''),
                   new Array('cannot_add_track_to_playlist',      'Error talking to Spotify',          'Couldn\'t add track to playlist.  Might be an internet issue, try again',             'no_action',             ''),
                   new Array('cannot_remove_track_from_playlist', 'Error talking to Spotify',          'Couldn\'t remopve track from playlist.  Might be an internet issue, try again',       'no_action',             ''),
                   new Array('track_not_playing',                 'No music playing',                  'You\'re not playing music in Spotify.  Play some music and try again',                'no_action',             ''),
                   new Array('podcast',                           'Podcasts aren\'t supported',        'Podcasts can\'t be added or removed from playlists.  Play some music and try again',  'no_action',             ''),
                   new Array('no_playlist_assigned',              'No playlist assigned to shortcut',  'Assign a playlist to this shortcut key, then try again',                              'playlist_settings',     'Open playlist settings')
)

///////////////////////////////////////////////////////////////////
//// Error lookup
///////////////////////////////////////////////////////////////////