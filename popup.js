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

    coordDisplayer.innerHTML = `Coordinates: ${latitude}, ${longitude}<br>City: ${cityName}<br>County: ${countyName}<br>State/Region: ${stateName}<br>Country: ${countryName}`;
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
  sendPlaceMarkerMessage(newLat, newLng);
}

function sendPlaceMarkerMessage(newLat, newLng) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    console.log(`Enviando mensagem para a tab ${tabs[0].id}`);
    chrome.tabs.sendMessage(tabs[0].id, {message: "place_marker", newLat: newLat, newLng: newLng});
  });
}

function CidadeProxima(latitude, longitude) {
  // Fazendo uma solicitação para obter a cidade mais próxima
  const apiUrl = `http://api.geonames.org/findNearbyPlaceNameJSON?lat=${latitude}&lng=${longitude}&username=nukeluke`;
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data.geonames.length > 0) {
        const cidadeMaisProxima = data.geonames[0].adminName1;
        document.getElementById('cidadePerto').innerText = `Cidade mais próxima: ${cidadeMaisProxima}`;
      } else {
        document.getElementById('cidadePerto').innerText = 'Nenhuma cidade encontrada nas coordenadas fornecidas.';
      }
    })
}

document.getElementById('cidPerto').addEventListener('click', () => {
  getCoordinates((error, { latitude, longitude }) => {
    if (error) {
      console.error('Error retrieving coordinates:', error);
    } else {
      CidadeProxima(latitude, longitude);
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

 //Evento de clique no botão para exibir a distância do palpite do inimigo
document.getElementById('palpInimigo').addEventListener('click', () => {
  console.log("Distancia")
  //displayEnemyDistance();
});


// Evento "click" no botão submitBtn
document.getElementById("submitBtn").addEventListener("click", () => {
  setTimeout(() => {
  getCoordinates((error, { latitude, longitude }) => {
    if (error) {
      console.error('Error retrieving coordinates:', error);
    } else {
      const distanceKm = document.getElementById('distanceInputKm').value;
      guess_location(latitude, longitude, distanceKm);
    }
  });
  }, 800);
});