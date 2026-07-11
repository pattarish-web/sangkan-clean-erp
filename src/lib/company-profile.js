export const DEFAULT_COMPANY_PROFILE = {
  name: 'บริษัท สั่งการ คลีน จำกัด',
  address: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
  phone: '02-123-4567',
  fax: '02-123-4568',
  taxId: '0105567890123',
  email: 'accounting@sangkan.com',
  banks: [
    { id: 'KBANK', name: 'ธนาคารกสิกรไทย', accName: 'บจก. สั่งการ คลีน', accNo: '012-3-45678-9' },
    { id: 'SCB', name: 'ธนาคารไทยพาณิชย์', accName: 'บจก. สั่งการ คลีน', accNo: '987-6-54321-0' },
    { id: 'BBL', name: 'ธนาคารกรุงเทพ', accName: 'บจก. สั่งการ คลีน', accNo: '111-2-33344-5' },
  ],
  defaultBankId: 'KBANK',
};

export function mergeCompanyProfile(saved) {
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_COMPANY_PROFILE };
  return {
    ...DEFAULT_COMPANY_PROFILE,
    ...saved,
    banks: saved.banks?.length ? saved.banks : DEFAULT_COMPANY_PROFILE.banks,
  };
}

export function defaultBank(profile) {
  const p = mergeCompanyProfile(profile);
  return p.banks.find((b) => b.id === p.defaultBankId) || p.banks[0];
}
