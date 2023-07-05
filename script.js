console.log('content_script.js carregado');
chrome.runtime.onMessage.addListener((request, sender) => {
  console.log('Mensagem recebida:', request);
  if (request.message === "place_marker") {
    placeMarker(request.newLat, request.newLng);
  }
});


  function placeMarker(newLat, newLng) {
    const script = document.createElement('script');
    script.textContent = `
      const element = document.getElementsByClassName("guess-map__canvas-container")[0];
      const keys = Object.keys(element);
      const key = keys.find(key => key.startsWith("__reactFiber$"));
      const place = element[key].return.memoizedProps.onMarkerLocationChanged;
      
      place({lat: ${newLat}, lng: ${newLng}});
    `;
    (document.head||document.documentElement).appendChild(script);
    script.remove();
  }
  