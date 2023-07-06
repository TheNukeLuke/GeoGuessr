async function display() {
  const coordDisplayer = document.querySelector('#coordDisplayer');
  const { coords } = await chrome.storage.sync.get('coords');

  if (!coords) {
    coordDisplayer.innerHTML = 'No coordinates found';
    return;
  }

  const [latitude, longitude] = JSON.parse(coords);
  const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Failed to retrieve location information');
    }
    const data = await response.json();

    const address = data.address;
    const cityName = address.city ? address.city : 'City name not found';
    const countyName = address.county ? address.county : 'County name not found';
    const stateName = address.state ? address.state : 'State/Region name not found';
    const countryName = address.country ? address.country : 'Country name not found';
    const countryCode = address.country_code ? address.country_code.toLowerCase() : null;

    coordDisplayer.innerHTML = `Coordinates: ${latitude}, ${longitude}<br>City: ${cityName}<br>County: ${countyName}<br>State/Region: ${stateName}<br>Country: ${countryName}<br>Country Code: ${countryCode ? countryCode.toUpperCase() : 'Country code not found'}`;

    if (countryCode) {
      let flagURL = `https://flagcdn.com/w80/${countryCode}.png`;
      let flagImg = document.createElement('img');
      flagImg.style.width = '12px';
      flagImg.style.height = '9px';
      flagImg.src = flagURL;
      coordDisplayer.appendChild(flagImg);
    } else {
      console.error('No country code found');
    }
  } catch (error) {
    console.error('Error fetching location information:', error);
    coordDisplayer.innerHTML = 'An error occurred';
  }
}

display();

// Função para obter as coordenadas
function getCoordinates(callback) {
  chrome.storage.sync.get('coords', ({ coords }) => {
    if (!coords) {
      callback('No coordinates found', null);
    } else {
      const [latitude, longitude] = JSON.parse(coords);
      callback(null, { latitude, longitude });
    }
  });
}

// Função para calcular a localização aproximada com base nas coordenadas
function guess_location(latitude, longitude, distanceKm) {
  const earthRadius = 6371;
  const delta = distanceKm / earthRadius;
  const theta = Math.random() * 2 * Math.PI;
  const deltaLat = delta * Math.sin(theta);
  const deltaLng = delta * Math.cos(theta) / Math.cos(latitude * Math.PI / 180);
  let newLat = latitude + deltaLat * (180 / Math.PI);
  let newLng = longitude + deltaLng * (180 / Math.PI);
  // Define os limites de latitude e longitude
  const minLat = -87.24503;
  const maxLat = 86.86507;
  const minLng = -178.38742;
  const maxLng = 175.19258;

  // Verifica e ajusta os valores dentro dos limites
  if (newLat < minLat) {
    newLat = minLat;
  } else if (newLat > maxLat) {
    newLat = maxLat;
  }
  if (newLng < minLng) {
    newLng = minLng;
  } else if (newLng > maxLng) {
    newLng = maxLng;
  }
  placeMarker(newLat, newLng);
}

function placeMarker(newLat, newLng) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    let code = function (coords) {
      const element = document.getElementsByClassName("guess-map__canvas-container")[0];
      const keys = Object.keys(element);
      const key = keys.find(key => key.startsWith("__reactFiber$"));
      const place = element[key].return.memoizedProps.onMarkerLocationChanged;
      place(coords);
    }

    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: code,
      args: [{lat: newLat, lng: newLng}],
      world: 'MAIN'
    });
  });
}

function CidadeProxima(latitude, longitude) {
  var requestOptions = {
    method: 'GET',
  };
  fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=7bdc955ef5a44a3d960b707b74310d29`, requestOptions)
    .then(response => response.json())
    .then(data => {
      if (data.features.length > 0) {
        const cidadeMaisProxima = data.features[0].properties.city;
        document.getElementById('cidadePerto').innerText = `Cidade mais próxima: ${cidadeMaisProxima}`;
      } else {
        document.getElementById('cidadePerto').innerText = 'Nenhuma cidade encontrada nas coordenadas fornecidas.';
      }
    })
    .catch(error => console.log('error', error));
}

// Evento "click" no botão submitBtn
document.getElementById("submitBtn").addEventListener("click", () => {
  getCoordinates((error, { latitude, longitude }) => {
    if (error) {
      console.error('Error retrieving coordinates:', error);
    } else {
      const distanceKm = document.getElementById('distanceInputKm').value;
      guess_location(latitude, longitude, distanceKm);
    }
  });
});

// Evento "click" no botão abrirMapa
document.getElementById("abrirMapa").addEventListener("click", () => {
  setTimeout(() => {
  getCoordinates((error, { latitude, longitude }) => {
    if (error) {
      console.error('Error retrieving coordinates:', error);
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      window.open(url, '_blank');
    }
});
});
}, 800);

// Evento "click" no botão CidadeProxima
document.getElementById('cidPerto').addEventListener('click', () => {
  getCoordinates((error, { latitude, longitude }) => {
    if (error) {
      console.error('Error retrieving coordinates:', error);
    } else {
      CidadeProxima(latitude, longitude);
    }
  });
});

//Evento de clique no botão para exibir a distância do palpite do inimigo
//document.getElementById('palpInimigo').addEventListener('click', () => {
//});