import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { sharedStyles } from './sharedstyles.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-styles/paper-styles.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import '@polymer/app-route/app-route.js';


/**
 * @customElement
 * @polymer
 */
class RadioRecognitionFrontendApp extends PolymerElement {
  static get template() {
    return html`
      ${sharedStyles}
      <style include="iron-flex iron-flex-alignment">
        :host{
          @apply --layout-horizontal;
          @apply --layout-center-justified;

        }

        #container{
          height: 100%;
          padding-bottom: 20px;
        }
        #radio{
          color: white;
          width: 70vw;
          fill: white;
          filter: invert(0.2);
        }
        #radio[recording]{
          filter: invert(0.8);
        }
        .smalltext.self-center{
          text-align: center;
        }
        #information{
          margin-top: 50px;
          border-top: solid lightgrey 2px;
          border-bottom: solid lightgrey 2px;
          padding: 12px;
        }

        .spotifyButton{
          color: white;
          margin-top: 20px;
          margin-bottom: 20px;
          background-color:#1db954;
          border-radius:200px; /*Random value much larger than height of button*/
        }

      </style>


      <div id="container" class="layout vertical">
        <img id="radio" src="../../img/icons/radio.svg" class="self-center" on-click="onRadioTap" recording$=[[recording]]></img>
        <div class="smalltext self-center">
          <template is="dom-if" if=[[!recording]]>
            Tap radio to start recording...
          </template>
          <template is="dom-if" if=[[recording]]>
            Currently recording, tap radio to stop recording...
          </template>
        </div>
        <div id="information">
          <div class="layout horizontal">
            <span>Station:</span>
            <span class="flex"></span>
            <span>[[currentstation.stationname]] </span>
          </div>
          <div class="layout horizontal">
            <span>Song:</span>
            <span class="flex"></span>
            <span>[[currentstation.song.name]] - [[currentstation.song.artist]]</span>
          </div>
          <div class="layout horizontal">
            <span>DJ:</span>
            <span class="flex"></span>
            <span>[[currentstation.dj]]</span>
          </div>
        </div>
        <span class="flex"></span>
          <template is="dom-if" if="[[!authorizedSpotify]]">
            <paper-button id="spotifyConnectButton" class="spotifyButton" on-tap="onSpotifyAuthTap">Connect with Spotify</paper-button>
          </template>
        <template is="dom-if" if="[[_and(authorizedSpotify, currentSongURL)]]">
          <paper-button id="openSongInSpotifyButton" class="spotifyButton" on-tap="openSongInSpotify">Open in Spotify</paper-button>
        </template>
      </div>
      
      
    `;
  }
  static get properties() {
    return {
      recording: {
        type: Boolean,
        value: false,
      },
      currentstation: {
        observer: "_onCurrentStationChange"
      },
      routeData: {
      },
      spotifyAccessToken: {
        observer: '_onSpotifyAccessTokenChanged'
      },
      currentSongURL: {
        type: String,
        value: ''
      },
      authorizedSpotify: {
        value: false,
      },
      mediaStream: Object,
      mediaRecorder: Object,
    };
  }


  onRadioTap() {
    if(this.recording){
      this._stopAudioRecorder()
    }else{
      this._initAudioRecorder()
    }
    this.recording = !this.recording;
    this.updateStyles();
  }
  onSpotifyAuthTap() {

    if (spotifyConfig.client_id) {
      window.location.href = "https://accounts.spotify.com/authorize?client_id=" + spotifyConfig.client_id + "&response_type=token&redirect_uri=" + encodeURIComponent(APP_URL)
    } else {
      console.log("Spotify clientid not found")
    }
  }

  ready() {
    super.ready()
    if (window.localStorage.getItem('spotifyAccessToken')) {
      var token = JSON.parse(window.localStorage.getItem('spotifyAccessToken'))
      //Check if token is still valid
      if (new Date(token.expires_at).getTime() > new Date().getTime()) {
        this.spotifyAccessToken = token;
      } else {
        window.localStorage.removeItem('spotifyAccessToken')
      }
    }

    if (window.location.hash && this.parseURLparameters(window.location.hash)) {
      var hashWithoutHashSymbol = window.location.hash.substring(1)
      var params = this.parseURLparameters(hashWithoutHashSymbol)
      if (params.access_token) {
        this.spotifyAccessToken = { token: params.access_token, expires_at: new Date(new Date().getTime() + (1000 * params.expires_in)) };
      } else if (params.error) {
        console.error("Error with spotify authentication", params.error)
      }
      window.location.hash = ''
    }
  }

  _initAudioRecorder() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        this.mediaStream = stream;
        var options = {
          audioBitsPerSecond: 128000,
          videoBitsPerSecond: 2500000,
          mimeType: 'audio/webm;codecs=opus'

        }
        this.mediaRecorder = new MediaRecorder(stream, options)
        this.mediaRecorder.start(5000)
        //Recorder calls data available every 5000ms
        this.mediaRecorder.ondataavailable = (e) => {
            var reader = new FileReader();
            reader.readAsDataURL(e.data)
            reader.onloadend = () => this._sendToBackend(reader.result)
        }
      })
  }

  _stopAudioRecorder(){
    this.mediaStream.getTracks()[0].stop();
  }

  _sendToBackend(base64audio){
    axios.post(BACKEND_URL + '/analysis', {audio: base64audio})
    .then((resp) => this.set('currentstation', resp.data))
    .catch((err) => console.log(err))
  }

  parseURLparameters(string) {
    let parsed = {};
    (string.split('?')[1] || string).split('&')
      .map((item) => {
        return item.split('=');
      })
      .forEach((item) => {
        parsed[item[0]] = item[1];
      });
    return parsed;
  }

  spotifyAccesstokenDefined(spotifyAccessToken) {
    return spotifyAccessToken && spotifyAccessToken.token && spotifyAccessToken.token !== ''
  }

  _onCurrentStationChange() {
    if (this.spotifyAccesstokenDefined(this.spotifyAccessToken)) {
      axios.get("https://api.spotify.com/v1/search?q=" + encodeURIComponent(this.currentstation.song.name) + "&type=track", { headers: { Authorization: 'Bearer ' + this.spotifyAccessToken.token } })
        .then((resp) => this.set('currentSongURL', resp.data.tracks.items[0].external_urls.spotify))
        .catch((err) => console.log(err))
    }
  }

  openSongInSpotify() {
    if (this.currentSongURL) {
      window.open(this.currentSongURL, '_blank')
    } else {
      console.log('CurrentSongURL undefined')
    }
  }

  _onSpotifyAccessTokenChanged() {
    if (this.spotifyAccessToken) {
      window.localStorage.setItem('spotifyAccessToken', JSON.stringify(this.spotifyAccessToken))
      this.authorizedSpotify = true;
    }
  }

  notEmptyString(string) {
    return string && string !== ''
  }

  _and(a, b) {
    return a && b;
  }

}

window.customElements.define('radio-recognition-frontend-app', RadioRecognitionFrontendApp);
