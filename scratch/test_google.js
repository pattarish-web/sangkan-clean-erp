// Native fetch will be used

async function test() {
  try {
    const companyQuery = '0115567013107';
    const url = `https://www.yellowpages.co.th/search?keyword=${encodeURIComponent(companyQuery)}`;
    console.log('Fetching YellowPages:', url);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Status:', res.status);
    const html = await res.text();
    console.log('HTML Length:', html.length);
    
    console.log('HTML content:', html);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
