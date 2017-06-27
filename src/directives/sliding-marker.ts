import {Directive, OnInit} from '@angular/core';

import { BaseMapDirective } from './base-map-directive';
import { NguiMapComponent } from '../components/ngui-map.component';

const INPUTS = [
  'anchorPoint', 'animation', 'clickable', 'cursor', 'draggable', 'icon', 'label', 'opacity',
  'optimized', 'place', 'position', 'shape', 'title', 'visible', 'zIndex', 'options',
  // ngui-map specific inputs
  'geoFallbackPosition'
];
const OUTPUTS = [
  'animationChanged', 'click', 'clickableChanged', 'cursorChanged', 'dblclick', 'drag', 'dragend', 'draggableChanged',
  'dragstart', 'flatChanged', 'iconChanged', 'mousedown', 'mouseout', 'mouseover', 'mouseup', 'positionChanged', 'rightclick',
  'shapeChanged', 'titleChanged', 'visibleChanged', 'zindexChanged'
];

@Directive({
  selector: 'ngui-map > sliding-marker',
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
          let startPos = this.mapObject.getPosition();
          if(startPos != null ){
          let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          this.mapObject.setPosition(latLng);
          }
          else{
          let pointsNo : number = 100;
          let delay = 10;
          let count = 0;
          let latDelta = startPos.lat();
          let lngDelta = startPos.lng();
          let endPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          moveMarker =>{
          if(count < pointsNo){
          latDelta = latDelta + (endPos.lat() - startPos.lat()) / pointsNo;
          lngDelta = lngDelta + (endPos.lng() - startPos.lng()) / pointsNo;
          let latLng = new google.maps.LatLng(latDelta, lngDelta);
          this.mapObject.setPosition(latLng);
          count ++;
          setTimeout(moveMarker, delay);
          }
          }
        }
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
  }
}
