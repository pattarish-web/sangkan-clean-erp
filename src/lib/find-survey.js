/** จับคู่ใบสำรวจกับดีล/ใบเสนอราคา — ใช้ร่วมกัน CRM, Operations */
export function findSurveyForDeal(deal, quote, surveys = []) {
  if (!deal && !quote) return null;
  const dealId = deal?.id || quote?.id;
  const customer = String(deal?.customer || quote?.customer || '').trim().toLowerCase();
  const project = String(deal?.projectName || quote?.projectName || '').trim().toLowerCase();

  const byLink = surveys.find(
    (s) =>
      s.linkedQuotationId === dealId ||
      s.quoteId === dealId ||
      s.surveyId === dealId ||
      s.id === dealId
  );
  if (byLink) return byLink;

  if (quote?.linkedSurveyId) {
    const byQtSurvey = surveys.find(
      (s) => s.id === quote.linkedSurveyId || s.surveyId === quote.linkedSurveyId
    );
    if (byQtSurvey) return byQtSurvey;
  }

  if (customer && project) {
    const both = surveys.find(
      (s) =>
        String(s.customer || '').trim().toLowerCase() === customer &&
        String(s.projectName || '').trim().toLowerCase() === project
    );
    if (both) return both;
  }

  if (customer) {
    return surveys.find((s) => String(s.customer || '').trim().toLowerCase() === customer) || null;
  }

  return null;
}
