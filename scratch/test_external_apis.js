
async function test() {
  try {
    const res = await fetch('https://nominatim.openstreetmap.org/search?q=Patna&format=json&limit=5');
    console.log('Nominatim Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('Nominatim Data:', JSON.stringify(data).slice(0, 500));
    }
  } catch (e) {
    console.error('Nominatim Error:', e);
  }

  try {
    const res = await fetch('https://www.timeapi.io/api/TimeZone/coordinate?latitude=25.5941&longitude=85.1376');
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
