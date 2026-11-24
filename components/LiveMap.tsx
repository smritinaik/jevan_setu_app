import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export type MapItem = { lat: number; lng: number; label?: string; type: 'ambulance' | 'junction' | 'selected' };

const html = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#m{height:100%;margin:0}</style></head><body><div id="m"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map=L.map('m').setView([20.59,78.96],5);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
var layer=L.layerGroup().addTo(map); var lastN=0;
function col(t){return t==='ambulance'?'#D50000':t==='selected'?'#2E7D32':'#6B0F1A'}
window.update=function(items){
  layer.clearLayers(); var pts=[];
  items.forEach(function(i){
    var c=L.circleMarker([i.lat,i.lng],{radius:i.type==='ambulance'?12:8,color:'#fff',weight:2,fillColor:col(i.type),fillOpacity:1}).addTo(layer);
    if(i.label)c.bindTooltip(i.label,{permanent:i.type==='ambulance'});
    pts.push([i.lat,i.lng]);
  });
  if(pts.length&&lastN!==pts.length){map.fitBounds(pts,{padding:[40,40],maxZoom:16});lastN=pts.length;}
};
</script></body></html>`;

export default function LiveMap({ items, height = 240 }: { items: MapItem[]; height?: number }) {
const ref = useRef<any>(null);
  const ready = useRef(false);

  const push = () => {
    if (ready.current) ref.current?.injectJavaScript(`window.update(${JSON.stringify(items)});true;`);
  };
  useEffect(push, [items]);

  return (
    <View style={{ height, borderRadius: 16, overflow: 'hidden' }}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={{ html }}
        onLoadEnd={() => { ready.current = true; push(); }}
        javaScriptEnabled
      />
    </View>
  );
}