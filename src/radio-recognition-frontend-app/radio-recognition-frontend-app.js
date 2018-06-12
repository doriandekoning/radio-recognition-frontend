import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { sharedStyles } from './sharedstyles.js';
import { } from '@polymer/paper-button/paper-button.js';
import { } from '@polymer/paper-styles/paper-styles.js';
import { } from '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import { } from '@polymer/polymer/lib/elements/dom-if.js';
// import { } from '@polymer/app-route/app-location.html';
import { } from '@polymer/app-route/app-route.js';

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
      <app-location route="{{route}}" use-hash-as-path></app-location>
      <app-route route="{{route}}" pattern="/:pattern" data="{{routeData}}"></app-route>
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
          <div class="text">Detected station:</div>
          <img style="width:70vw" src="https://www.radiofreak.nl/wp-content/uploads/2016/01/npo-3fm-plain-rgb-zonderoutl-1024x392.png"></img>
          <div class="layout horizontal">
            <span>Song:</span>
            <span class="flex"></span>
            <span>[[currentstation.songs.0.name]] - [[currentstation.songs.0.artist]]</span>
          </div>
          <div class="layout horizontal">
            <span>DJ:</span>
            <span class="flex"></span>
            <span>[[currentstation.dj.name]]</span>
          </div>
        </div>
        <span class="flex"></span>
        <template is="dom-if" if="[[!spotifyAccesstokenDefined(spotifyAccessToken)]]">
          <paper-button id="spotifyConnectButton" class="spotifyButton" on-tap="onSpotifyAuthTap">Connect with Spotify</paper-button>
        </template>
        [[this.currentSongURL]]
        <template is="dom-if" if="[[spotifyAccesstokenDefined(spotifyAccessToken)]]">
          <paper-button id="openSongInSpotifyButton" class="spotifyButton" on-tap="openSongInSpotify">Open in Spotify</paper-button>
        </template>
        <paper-button id="updateStationbutton" on-tap="updateStation">Update station</paper-button>
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
        value: ''
      },
      currentSongURL:{
        type: String, 
      }
    };
  }


  onRadioTap() {
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

  updateStation() {
    this.currentstation = {
      name: 'I/O FM',
      songs: [
        {
          name: 'Colossus',
          artist: 'IDLES'
        }
      ],
      dj: {
        name: 'Dorian'
      }

    }
  }

  ready() {
    super.ready()
    if (window.location.hash && this.parseURLparameters(window.location.hash)) {
      var hashWithoutHashSymbol = window.location.hash.substring(1)
      var params = this.parseURLparameters(hashWithoutHashSymbol)
      if (params.access_token) {
        this.spotifyAccessToken = params.access_token;
      } else if (params.error) {
        console.error("Error with spotify authentication", params.error)
      }
      window.location.hash = ''
    }
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
    return spotifyAccessToken && spotifyAccessToken !== ''
  }

  _onCurrentStationChange() {
    if (this.spotifyAccesstokenDefined(this.spotifyAccessToken)) {
      axios.get("https://api.spotify.com/v1/search?q=" + encodeURIComponent(this.currentstation.songs[0].name) + "&type=track", { headers: { Authorization: 'Bearer '+ this.spotifyAccessToken } })
        .then((resp) =>this.set('currentSongURL', resp.data.tracks.items[0].external_urls.spotify))
        .catch((err) => console.log(err))
    }
  }

  openSongInSpotify(){
    if(this.currentSongURL){
    window.open(this.currentSongURL, '_blank')
    }else{
      console.log('CurrentSongURL undefined')
    }
  }

}

window.customElements.define('radio-recognition-frontend-app', RadioRecognitionFrontendApp);
