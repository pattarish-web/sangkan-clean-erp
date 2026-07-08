import { prisma, normalizeSheet } from './prisma.js';
import { SEED_DATA } from './seed-data.js';

const DEFAULT_SETTINGS = {
  commissionRate: 10,
  minMargin: 25,
  maidDailyRate: 500,
  maidHourlyOt: 75,
  supervisorDailyRate: 800,
  soapGallonCost: 150,
  trashBagKgCost: 65,
  tissueRollCost: 12,
  scrubberDailyDepreciation: 250,
  vacuumDailyDepreciation: 100,
  scaffoldDailyDepreciation: 300,
};

export async function seedDatabase() {
  const tasks = [];

  for (const [sheetName, records] of Object.entries(SEED_DATA)) {
    const sheet = normalizeSheet(sheetName);
    for (const record of records) {
      if (!record?.id) continue;
      tasks.push(
        prisma.dataRecord.upsert({
          where: {
            sheet_recordId: { sheet, recordId: String(record.id) },
          },
          create: {
            sheet,
            recordId: String(record.id),
            data: record,
          },
          update: {
            data: record,
          },
        })
      );
    }
  }

  tasks.push(
    prisma.appSetting.upsert({
      where: { key: 'sangkan_settings' },
      create: { key: 'sangkan_settings', value: DEFAULT_SETTINGS },
      update: { value: DEFAULT_SETTINGS },
    })
  );

  const BLOB_SETTINGS = {
    sangkan_crm_deal_stages: {},
    sangkan_billing_approved: {},
    sangkan_actual_costs: {},
    sangkan_monthly_logs: {},
    sangkan_current_survey: null,
    sangkan_execution_reports: {},
  };

  for (const [key, value] of Object.entries(BLOB_SETTINGS)) {
    tasks.push(
      prisma.appSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    );
  }

  await Promise.all(tasks);
}
