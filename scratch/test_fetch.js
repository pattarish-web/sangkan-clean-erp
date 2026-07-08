// Native fetch will be used

async function test() {
  try {
    const url = 'https://www.dataforthai.com/company/0105540092073/';
    console.log('Fetching', url);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    console.log('Status:', res.status);
    const html = await res.text();
    console.log('HTML Length:', html.length);
    console.log('Preview:', html.substring(0, 1000));
    
    // Check if we can find company name in HTML
    const nameMatch = html.match(/<h1>(.*?)<\/h1>/) || html.match(/<title>(.*?)<\/title>/);
    console.log('Title match:', nameMatch ? nameMatch[1] : 'Not found');
    
    // Check for address
    const addressIndex = html.indexOf('ที่ตั้ง');
    if (addressIndex !== -1) {
      console.log('Address snippet:', html.substring(addressIndex, addressIndex + 500));
    } else {
      console.log('Address not found');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
