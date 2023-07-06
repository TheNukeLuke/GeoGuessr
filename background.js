chrome.webRequest.onCompleted.addListener(async (request) => {
    if (request.method !== 'GET' || request.type !== 'script' || !request.url.includes('GeoPhotoService')) {
        return;
    }

    try {
        const response = await fetch(request.url);
        const data = await response.text();

        const coordMatch = data.match(/\[null,null,-?\d*.\d*,-?\d*.\d*\]/);
        if (!coordMatch) {
            console.log('No coordinate data found');
            return;
        }

        const coordHolder = JSON.parse(coordMatch[0]);
        let coords;
        if (Array.isArray(coordHolder) && coordHolder.length >= 4) {
            coords = coordHolder.slice(2, 4);
        } else {
            console.error('Invalid coordinate data');;
            return;
        }

        chrome.storage.sync.set({ coords: JSON.stringify(coords) }, () => {
            console.log('Value set:', coords);
        });

        console.log('-'.repeat(50));
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}, { urls: ['<all_urls>'] });