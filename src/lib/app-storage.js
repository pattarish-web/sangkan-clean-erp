import { fetchSetting, saveSetting } from '@/utils/api';

export async function loadSettingJson(key, fallback) {
  try {
    const value = await fetchSetting(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function saveSettingJson(key, value) {
  return saveSetting(key, value);
}
