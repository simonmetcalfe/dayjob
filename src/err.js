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
                   new Array('no_authorisation_code',             'Check Spotify connection',          'dayjob needs authorising with Spotify.',                                              'authorise_dayjob',     'Authorise in web browser'),
                   new Array('error_authorising',                 'Error talking to Spotify',          'Couldn\'t authorise dayjob with Spotify.  It may be an internet issue.  Please try again.',                              'authorise_dayjob',     'Authorise in web browser'),
                   new Array('cannot_refresh_access_token',       'Error talking to Spotify',          'Couldn\'t refresh access token.  It may be an internet issue.  Please try again.',              'connect_api',             'Try again'),
                   new Array('cannot_get_users_details',          'Error talking to Spotify',          'Couldn\'t get the users details.  It may be an internet issue.  Please try again.',             'connect_api',             'Try again'),
                   new Array('cannot_get_playing_track_info',     'Error talking to Spotify',          'Couldn\'t get info on the playing track.  It may be an internet issue.  Please try again.',     '',             ''),
                   new Array('cannot_get_playlist_info',          'Error talking to Spotify',          'Couldn\'t get playlist info.  It may be an internet issue.  Please try again.',               '',             ''),
                   new Array('cannot_get_source_playlist_name',   'Error talking to Spotify',          'Couldn\'t get playlist name.  It may be an internet issue.  Please try again.',                              '',     ''),
                   new Array('cannot_add_track_to_playlist',      'Error talking to Spotify',          'Couldn\'t add track to playlist.  It may be an internet issue.  Please try again.',             '',             ''),
                   new Array('cannot_remove_track_from_playlist', 'Error talking to Spotify',          'Couldn\'t remove track from playlist.  It may be an internet issue.  Please try again.',       '',             ''),
                   new Array('track_not_playing',                 'No music playing',                  'You\'re not playing music in Spotify.  Don\'t be boring and play something!',                '',             ''),
                   new Array('podcast',                           'Podcasts aren\'t supported',        'Podcasts can\'t are not suppored.  Please play music from another source.',  '',             ''),
                   new Array('error_parsing_playing_track_json',  'Error talking to Spotify',          'Couldn\'t understand the JSON response.  It may be an internet issue.  Please try again.',                              '',''),
                   new Array('playlist_is_read_only',             'Cannot remove song',                'The playlist is read only.',                              '',     ''),
                   new Array('no_playlist_assigned',              'No playlist assigned to shortcut',  'Please assign a playlist to this shortcut key, then try again.',                              'playlist_settings',     'Open playlist settings')


                   )

///////////////////////////////////////////////////////////////////
//// Error lookup
///////////////////////////////////////////////////////////////////