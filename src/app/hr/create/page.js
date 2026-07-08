'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateEmployeeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/hr/register');
  }, [router]);

  return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
      กำลังนำทางไปหน้าลงทะเบียนพนักงาน...
    </div>
  );
}
