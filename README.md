<img src="assets_readme/dayjob_banner_v1.png">

# dayjob
dayjob lets you add tracks to your favourite playlists by using shortcut keys.  It's a great way to make awesome playlists without being distracted from your work.

- Add tracks from any Spotify source (playlists, radio, Discover Weekly etc.)
- Supports all Spotify players (desktop, mobile, web)
- Optioanlly remove and skip boring tracks from the current playlist
- Cross-platform ([Node JS Electron](https://electronjs.org/))

|Play some music on Spotify|When you hear a good track, press a shortcut |dayjob adds it to your playlist|
|:-----:|:-----:|:-----:|
|<img src="assets_readme/spotify_playlist.png" width=200>|<img src="assets_readme/ctrl+alt+1.png" height=50>|<img src="assets_readme/dayjob_screenshot.png" height=80>

## Download
Current veresion:  1.0.0

|Mac|Windows|Linux|
|:-----:|:-----:|:-----:|
|[Download](https://www.dropbox.com)|Coming soon!|Coming soon!|
|dayjob.dmg|Register your interest [here](https://github.com/simonmetcalfe/dayjob/issues/1)|Register your interest [here](https://github.com/simonmetcalfe/dayjob/issues/1)|

## Keyboard shortcuts
Add tracks to up to 10 favourite playlists by using the keyboard keys 1, 2, 3, 4, 5, 6, 7, 8 ,9 and 0.

<img src="assets_readme/dayjob_keyboard_shortcuts_colour.png" width=600>

|Shortcut|Function|
|:-----:|:-----:|
|<img src="assets_readme/ctrl+alt+1to0.png" height=50>|Add track to playlist #|
|<img src="assets_readme/ctrl+alt+shift+1to0.png" height=50>|Move track to playlist #|
|<img src="assets_readme/ctrl+alt+minus.png" height=50>|Remove track from current playlist|
|<img src="assets_readme/ctrl+alt+shift+minus.png" height=50>|Remove track from current playlist and skip to next song |

## Limitations

* Tracks can only be moved or removed from the source playlist if you are the playlist owner.  
* If trying to move tracks from a shared playlist, the radio, artists, etc., dayjob will warn you and fall back to copying

## Getting started
### Right-click menu
* dayjob will prompt you to set up the Spotify connection on first use, but aftwarards you use the right-click menu to open the Preferences at any time   
|<img src="assets_readme/dayjob_rightclick_menu.png" height=120>

### Configure Spotify connection
1. Log in to your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/) and create a new Client ID,
    * App or Hardware Name:  _dayjob_
    * App or Hardware Description: _Make great Spotify playlists while you work_
    * What are you building?:  _Desktop app_
    * Commercial:  _No_
    * Redirect URI:  http://localhost:8888/callback
1. Enter the Client ID and secret into dayjob and click *Connect to Spotify*
1. Follow the prompts to authorise

|<img src="assets_readme/dayjob_preferences_spotify.png" width=600>

### Add your playlists
1. Right-click on a playlist in the Spotify app, and select *Share > Copy Spotify URI*. 
1. Goto the *Playlists* tab in dayjob Settings and paste the playlist URI into an empty slot
1. Type a name for the playlist.

|<img src="assets_readme/dayjob_preferences_playlists.png" width=600>

## History
I created this app because I love discovering new music when at work, but wanted to minimise distractions and the time spent in the Spotify app.  I've been using a proof of concept since 2017, but finally in 2019 I'm able to release a configurable version that everyone can use!

## Development

I'm not a developer by profession so apologise for any bugs and (a healthy dose of) poor coding practices!  dayjob is a simple project and should be easy to maintain.  After cloning use *npm install dayjob* to install.

A list of know issues (mostly tech debt) is maintained in GitHub which I might get round to some day.  Please log any bugs which relate to functionality issues and I will try and fix them.






  
