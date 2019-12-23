<img src="assets_readme/dayjob_banner_v1.png">

# dayjob
dayjob is a desktop app that lets you add tracks to your favourite playlists by using shortcut keys.  It's a great way to make awesome playlists without being distracted from your work.

- Add tracks from any Spotify source (playlists, radio, Discover Weekly etc.)
- Remove and skip boring tracks from the current playlist
- Supports all Spotify players (desktop, mobile, web)
- Cross-platform (written in [Electron](https://electronjs.org/))
- Zero network usage when idle

|Play some new music|Hear a good tune?  Press a shortcut |dayjob adds it to your playlist|
|:-----:|:-----:|:-----:|
|<img src="assets_readme/spotify_playlist.png" height=150>|<img src="assets_readme/ctrl+alt+1.png" height=50>|<img src="assets_readme/dayjob_screenshot.png" height=150>

## Download
Before downloading please read the [disclaimer](https://opensource.org/licenses/MIT).

|Mac|Windows|Linux|
|:-----:|:-----:|:-----:|
|[dayjob.dmg](https://www.dropbox.com)|Coming soon!|Coming soon!|
|v1.0.0|Register your interest [here](https://github.com/simonmetcalfe/dayjob/issues/1)|Register your interest [here](https://github.com/simonmetcalfe/dayjob/issues/2)|

## Keyboard shortcuts
Add tracks to 10 of your favourite playlists by using the keyboard keys 1, 2, 3, 4, 5, 6, 7, 8 ,9 and 0.

<img src="assets_readme/dayjob_keyboard_shortcuts_colour.png" width=600>

|Shortcut|Function|
|:-----:|:-----:|
|<img src="assets_readme/ctrl+alt+1to0.png" height=50>|Add track to playlist #|
|<img src="assets_readme/ctrl+alt+shift+1to0.png" height=50>|Move track to playlist #|
|<img src="assets_readme/ctrl+alt+minus.png" height=50>|Remove track from current playlist|
|<img src="assets_readme/ctrl+alt+shift+minus.png" height=50>|Remove track from current playlist and skip to next song |

## Limitations

* Tracks can only be moved or removed from a playlist if you are the playlist owner
* If you try to move tracks from a read only source (shared playlist, the radio, artists, etc.) dayjob will warn you and copy the track instead

## Getting started
### Icon and notification window
dayjob creates an icon in the the status / tray area of your computer.  It will mostly communicate with you through it's notification window.
<img src="assets_readme/dayjob_notification_welcome.png" height=200>

### Right-click menu
dayjob will prompt you to set up the Spotify connection on first use, but you use the right-click menu to open the Preferences or to quit at any time.   
<img src="assets_readme/dayjob_rightclick_menu.png" height=120>

### Configure Spotify connection
1. Log in to your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/) and create a new Client ID
    * App or Hardware Name:  _dayjob_
    * App or Hardware Description: _Make great Spotify playlists while you work_
    * What are you building?:  _Desktop app_
    * Commercial:  _No_
    * Redirect URI:  _http://localhost:8888/callback_
1. Enter the Client ID and secret into dayjob
1. Click *Connect to Spotify* and follow the prompts to authorise

<img src="assets_readme/dayjob_preferences_spotify.png" width=600>

### Add your playlists
1. Right-click on a playlist in the Spotify app, and select *Share > Copy Spotify URI*
1. Goto the *Playlists* tab in dayjob Preferences and paste the playlist URI into an empty slot
1. Type a name for the playlist.

<img src="assets_readme/dayjob_preferences_playlists.png" width=600>

### Start making playlists!
1. Play some music on Spotify (using the desktop, web or mobile client)
1. When a song is playing that you want to add to a playlist, add it using one of the [keyboard shortcuts](#keyboard-shortcuts).

## History
I created this app because I love discovering new music when at work, but wanted to minimise distractions and the time spent in the Spotify app.  I've been using a proof of concept since 2017, but finally in 2019 I'm able to release a configurable version that everyone can use.

## Development

I'm not a developer by profession so apologise for any bugs and poor coding practices!  dayjob is a simple project and should be easy to maintain.  After cloning use *npm install dayjob* to install.

A list of known issues and tech debt is maintained in GitHub which I might get round to some day.  

## Support

Please log any bugs which relate to functionality and I will try and fix them.

Enjoy!

## Credits

Banner image by [StockSnap](https://pixabay.com/users/StockSnap-894430/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=2618446) from [Pixabay](https://pixabay.com/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=2618446)




  
