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
  const apiUrl = `http://api.geonames.org/findNearbyPlaceNameJSON?lat=${latitude}&lng=${longitude}&username=nukeluke`;
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data.geonames.length > 0) {
        const cidadeMaisProxima = data.geonames[0].toponymName;
        document.getElementById('cidadePerto').innerText = `Cidade mais próxima: ${cidadeMaisProxima}`;
      } else {
        document.getElementById('cidadePerto').innerText = 'Nenhuma cidade encontrada nas coordenadas fornecidas.';
      }
    })
}

function findID() {
  const y = document.getElementsByClassName("user-nick_root__DUfvc")[0]
  const keys = Object.keys(y)
  const key = keys.find(key => key.startsWith("__reactFiber$"))
  const props = y[key]
  const id = props.return.memoizedProps.userId
  return id
}

function findEnemyTeam(teams, userID) {
  const player0 = teams[0].players[0].playerId
  if (player0 !== userID) {
      return teams[0]
  } else {
      return teams[1]
  }
}

function isRoundValid(gameState, guesses) { 
  const currentRound = gameState.currentRoundNumber
  const numOfUserGuesses = guesses ? guesses.length : 0;
  return currentRound === numOfUserGuesses
}

function getEnemyGuess() {
  const x = document.getElementsByClassName("game_layout__TO_jf")[0]
  if (!x) {
      return null
  }
  const keys = Object.keys(x)
  const key = keys.find(key => key.startsWith("__reactFiber$"))
  const props = x[key]
  const teamArr = props.return.memoizedProps.gameState.teams
  const enemyTeam = findEnemyTeam(teamArr, findID())
  const enemyGuesses = enemyTeam.players[0].guesses
  const recentGuess = enemyGuesses[enemyGuesses.length - 1]

  if (!isRoundValid(props.return.memoizedProps.gameState, enemyGuesses)) {
      return null;
  }
  return recentGuess.distance
}

function fetchEnemyDistance() {
  const enemyGuess = getEnemyGuess(); 

  if (enemyGuess === null) {
    return null;
  }

  const [latInimigo, lonInimigo] = enemyGuess;

  const distance = calculateDistance(latInimigo, lonInimigo, latitude, longitude);
  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function calculateDistance(latitude, longitude, latInimigo, lonInimigo) {
  const earthRadius = 6371; // Raio médio da Terra em quilômetros

  // Converter as coordenadas para radianos
  const lat1Rad = toRadians(latitude);
  const lon1Rad = toRadians(longitude);
  const lat2Rad = toRadians(latInimigo);
  const lon2Rad = toRadians(lonInimigo);

  // Diferença das coordenadas
  const deltaLat = lat2Rad - lat1Rad;
  const deltaLon = lon2Rad - lon1Rad;

  // Cálculo da distância usando a fórmula de haversine
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;

  return distance;
}

// Função para exibir a distância do palpite do inimigo
function displayEnemyDistance() {
  const enemyDistance = fetchEnemyDistance();

  if (enemyDistance !== null) {
    document.getElementById('distanceResult').textContent = `Distância do palpite do inimigo: ${enemyDistance.toFixed(2)} km`;
  } else {
    document.getElementById('distanceResult').textContent = 'Não foi possível obter a distância do palpite do inimigo.';
  }
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
document.getElementById('palpInimigo').addEventListener('click', () => {
  console.log("Distancia")
  distance = displayEnemyDistance();
  if (distance > 0) {
    document.getElementById('distanceResult').innerText = `Distancia do palpite inimigo: ${distance}KM`;
  } else {
    document.getElementById('distanceResult').innerText = 'O adversario ainda não fez o palpite';
  }
});