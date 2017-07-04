import {Directive, OnInit} from '@angular/core';

import { BaseMapDirective } from './base-map-directive';
import { NguiMapComponent } from '../components/ngui-map.component';

const INPUTS = [
  'anchorPoint', 'animation', 'clickable', 'cursor', 'draggable', 'icon', 'label', 'opacity',
  'optimized', 'place', 'position', 'shape', 'title', 'visible', 'zIndex', 'options',
  // ngui-map specific inputs
  'geoFallbackPosition','lastPosition'//for animation
];
const OUTPUTS = [
  'animationChanged', 'click', 'clickableChanged', 'cursorChanged', 'dblclick', 'drag', 'dragend', 'draggableChanged',
  'dragstart', 'flatChanged', 'iconChanged', 'mousedown', 'mouseout', 'mouseover', 'mouseup', 'positionChanged', 'rightclick',
  'shapeChanged', 'titleChanged', 'visibleChanged', 'zindexChanged'
];

@Directive({
  selector: 'ngui-map > marker',
  inputs: INPUTS,
  outputs: OUTPUTS,
})
export class Marker extends BaseMapDirective implements OnInit {
  public mapObject: google.maps.Marker;
  public objectOptions: google.maps.MarkerOptions = <google.maps.MarkerOptions>{};

  constructor(private nguiMapComp: NguiMapComponent) {
    super(nguiMapComp, 'Marker', INPUTS, OUTPUTS);
    console.log('marker constructor', 9999999 );
  }

  // Initialize this map object when map is ready
  ngOnInit() {
    if (this.nguiMapComponent.mapIdledOnce) { // map is ready already
      this.initialize();
    } else {
      this.nguiMapComponent.mapReady$.subscribe(map => this.initialize());
    }
  }

  initialize(): void {
    super.initialize();
    this.setPosition();
  }

  setPosition(): void {
    if (!this['position']) {
      this._subscriptions.push(this.nguiMapComp.geolocation.getCurrentPosition().subscribe(
        position => {
          console.log('setting marker position from current location');
          let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          this.mapObject.setPosition(latLng);
        },
        error => {
          console.error('ngui-map, error finding the current location');
          this.mapObject.setPosition(this.objectOptions['geoFallbackPosition'] || new google.maps.LatLng(0, 0));
        }
      ));
    } else if (typeof this['position'] === 'string') {
      this._subscriptions.push(this.nguiMapComp.geoCoder.geocode({address: this['position']}).subscribe(
        results => {
          console.log('setting marker position from address', this['position']);
          this.mapObject.setPosition(results[0].geometry.location);
        },
        error => {
          console.error('ngui-map, error finding the location from', this['position']);
          this.mapObject.setPosition(this.objectOptions['geoFallbackPosition'] || new google.maps.LatLng(0, 0));
        }
      ));
    }
    else if (this['lastPosition']) { // enable marker animation
      let startPos = this['lastPosition'];
      let endPos = new google.maps.LatLng(this['position'][0], this['position'][1]);
      if (startPos == null ) {
        this.mapObject.setPosition(endPos);
      }
      else {
        let pointsNo = 100;
        let count = 0;
        let delay = 10; // for 1 second
        let latDelta = ((endPos.lat() - startPos[0]) / pointsNo);
        let lngDelta = ((endPos.lng() - startPos[1]) / pointsNo);
        //linear animation
        let smoothMovement = setInterval(() => {
          count++;
          if (count > pointsNo) clearInterval(smoothMovement);
          else {
            let latLng = new google.maps.LatLng(startPos[0] + latDelta*count,startPos[1] + lngDelta*count);
            if (this.mapObject != null)this.mapObject.setPosition(latLng);
          }
        }, delay);
      }
    }
  }
}
