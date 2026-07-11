/** ตัดฟิลด์ราคาออกจาก object ก่อนแสดงในใบส่งมอบงาน */
export function stripPriceFields(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = { ...obj };
  const priceKeys = [
    'total', 'subTotal', 'vat', 'grandTotal', 'price', 'unitPrice', 'amount',
    'calculatedPrice', 'totalDirectCost', 'estimatedProfit', 'markupPercent',
    'dailyLaborTotal', 'lumpSumLaborCost', 'outsourceLaborCost', 'outsourceLaborTotal',
    'vehicleCost', 'boomLiftCost', 'suppliesCost', 'specialChemicals', 'safeguardCost',
    'toolsCost', 'safetyCost', 'otherCost', 'supervisorRate', 'maidRate', 'technicianRate',
    'outsourceSupervisorRate', 'outsourceMaidRate', 'outsourceTechnicianRate',
  ];
  priceKeys.forEach((k) => { delete clone[k]; });
  if (Array.isArray(clone.items)) {
    clone.items = clone.items.map((item) => {
      const { price, unitPrice, amount, total, ...rest } = item || {};
      return rest;
    });
  }
  if (Array.isArray(clone.vehicles)) {
    clone.vehicles = clone.vehicles.map((v) => {
      const { rate, ...rest } = v || {};
      return rest;
    });
  }
  return clone;
}

export function scopeItemsFromQuote(quote) {
  return (quote?.items || []).map((it) => ({
    description: it.description || it.name || '-',
    qty: it.qty || it.quantity || '',
    unit: it.unit || '',
  }));
}

export function surveyConditionLabels(survey) {
  if (!survey) return '-';
  const labels = [
    survey.nightShift && 'กะดึก',
    survey.highRise && 'งานที่สูง',
    survey.heavyStains && 'คราบฝังแน่น',
    survey.noWaterElectricity && 'ไม่มีน้ำ/ไฟ',
  ].filter(Boolean);
  return labels.length ? labels.join(' · ') : '-';
}

export function dailyLaborCount(survey) {
  if (!survey) return '-';
  const n =
    Number(survey.supervisorCount || 0) +
    Number(survey.maidCount || 0) +
    Number(survey.technicianCount || 0);
  return n > 0 ? `${n} คน` : '-';
}
