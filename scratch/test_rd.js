async function test() {
  try {
    const taxId = '0115567013107'; // Clean Care
    const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vat="https://rdws.rd.go.th/serviceRD3/vatserviceRD3">
   <soapenv:Header/>
   <soapenv:Body>
      <vat:Service>
         <vat:username>anonymous</vat:username>
         <vat:password>anonymous</vat:password>
         <vat:TIN>${taxId}</vat:TIN>
         <vat:Name></vat:Name>
         <vat:ProvinceCode>0</vat:ProvinceCode>
         <vat:AmphurCode>0</vat:AmphurCode>
         <vat:BranchNumber>0</vat:BranchNumber>
      </vat:Service>
   </soapenv:Body>
</soapenv:Envelope>`;

    const url = 'https://rdws.rd.go.th/serviceRD3/vatserviceRD3.asmx';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'https://rdws.rd.go.th/serviceRD3/vatserviceRD3/Service'
      },
      body: soapEnvelope
    });

    const xml = await res.text();
    
    const getField = (xmlString, tag) => {
      const match = xmlString.match(new RegExp(`<v${tag}[^>]*>([\\s\\S]*?)<\/v${tag}>`, 'i'));
      if (!match) return '';
      return match[1].replace(/<[^>]*>/g, '').trim();
    };

    const title = getField(xml, 'titleName');
    const name = getField(xml, 'Name');
    const building = getField(xml, 'BuildingName');
    const floor = getField(xml, 'FloorNumber');
    const houseNo = getField(xml, 'HouseNumber');
    const moo = getField(xml, 'MooNumber');
    const soi = getField(xml, 'SoiName');
    const street = getField(xml, 'StreetName');
    const subDistrict = getField(xml, 'Thambol');
    const district = getField(xml, 'Amphur');
    const province = getField(xml, 'Province');
    const postcode = getField(xml, 'PostCode');

    let addressParts = [];
    if (houseNo && houseNo !== '-') addressParts.push(`เลขที่ ${houseNo}`);
    if (building && building !== '-') addressParts.push(`อาคาร${building}`);
    if (floor && floor !== '-') addressParts.push(`ชั้น ${floor}`);
    if (moo && moo !== '-') addressParts.push(`หมู่ที่ ${moo}`);
    if (soi && soi !== '-') addressParts.push(`ซอย${soi}`);
    if (street && street !== '-') addressParts.push(`ถนน${street}`);
    if (subDistrict && subDistrict !== '-') {
      addressParts.push(province.includes('กรุงเทพ') ? `แขวง${subDistrict}` : `ตำบล${subDistrict}`);
    }
    if (district && district !== '-') {
      addressParts.push(province.includes('กรุงเทพ') ? `เขต${district}` : `อำเภอ${district}`);
    }
    if (province && province !== '-') addressParts.push(province.includes('กรุงเทพ') ? province : `จังหวัด${province}`);
    if (postcode && postcode !== '-') addressParts.push(postcode);

    const fullAddress = addressParts.join(' ').replace(/\s+/g, ' ');
    const fullName = `${title} ${name}`.replace(/\s+/g, ' ').trim();

    console.log('Parsed Company Name:', fullName);
    console.log('Parsed Full Address:', fullAddress);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
