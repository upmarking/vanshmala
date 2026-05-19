
async function test() {
  try {
    const res = await fetch('https://vedicpanchanga.com/api/search-location?q=Patna');
    console.log('Search Location Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('Search Location Data:', JSON.stringify(data).slice(0, 500));
    }
  } catch (e) {
    console.error('Search Location Error:', e);
  }

  try {
    const res = await fetch('https://vedicpanchanga.com/api/get-timezone?latitude=25.5941&longitude=85.1376');
    console.log('Get Timezone Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('Get Timezone Data:', JSON.stringify(data));
    }
  } catch (e) {
    console.error('Get Timezone Error:', e);
  }
}

test();
