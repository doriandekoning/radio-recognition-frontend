import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import {sharedStyles} from './sharedstyles.js';
import {} from '@polymer/paper-button/paper-button.js';
import {} from '@polymer/paper-styles/paper-styles.js';
import {} from '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import {} from '@polymer/polymer/lib/elements/dom-if.js';

/**
 * @customElement
 * @polymer
 */
class RadioRecognitionFrontendApp extends PolymerElement {
  static get template() {
    return html`
      ${sharedStyles}
      <style include="iron-flex">
        :host{
          @apply --layout-horizontal;
          @apply --layout-center-justified;
          height: 80vh;
        }
        #radio{
          color: white;
          width: 70vw;
          fill: white;
          filter: invert(0.2);
        }
        #radio[recording]{
          filter: invert(0.9);
        }
        .smalltext.self-center{
          text-align: center;
        }

      </style>
      <div class="layout vertical">
        <img id="radio" src="../../img/icons/radio.svg" class="self-center" on-click="onRadioTap" recording$=[[recording]]></img>
        <div class="smalltext self-center">
          <template is="dom-if" if=[[!recording]]>
            Tap radio to start recording...
          </template>
          <template is="dom-if" if=[[recording]]>
            Currently recording, tap radio to stop recording...
          </template>
        </div>
      </div>
      
    `;
  }
  static get properties() {
    return {
      recording:{
        type: Boolean,
        value: false,
      }
    };
  }

  onRadioTap(){
    this.recording = !this.recording;
    this.updateStyles();
  }
}

window.customElements.define('radio-recognition-frontend-app', RadioRecognitionFrontendApp);
