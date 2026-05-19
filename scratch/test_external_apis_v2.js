
async function test() {
  const headers = {
    'User-Agent': 'VanshMala/1.0 (contact@vanshmala.in)'
  };

  try {
    const res = await fetch('https://nominatim.openstreetmap.org/search?q=Patna&format=json&limit=5', { headers });
    console.log('Nominatim Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('Nominatim Data:', JSON.stringify(data).slice(0, 500));
    } else {
      console.log('Nominatim Error Body:', await res.text());
    }
  } catch (e) {
    console.error('Nominatim Error:', e);
  }

  try {
    const res = await fetch('https://www.timeapi.io/api/TimeZone/coordinate?latitude=25.5941&longitude=85.1376', { headers });
    console.log('TimeAPI Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('TimeAPI Data:', JSON.stringify(data));
    }
  } catch (e) {
    console.error('TimeAPI Error:', e);
  }
}

test();
