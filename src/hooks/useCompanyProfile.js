'use client';

import { useState, useEffect } from 'react';
import { loadSettingJson } from '@/lib/app-storage';
import { mergeCompanyProfile } from '@/lib/company-profile';

export function useCompanyProfile() {
  const [profile, setProfile] = useState(() => mergeCompanyProfile(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettingJson('sangkan_settings', {})
      .then((s) => setProfile(mergeCompanyProfile(s?.companyProfile)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { profile, loading };
}
