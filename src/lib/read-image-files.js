/** อ่านไฟล์รูปเป็น data URL สำหรับอัปโหลดฝั่ง client */
export function readFilesAsDataUrls(fileList, { max = 30, type = 'During' } = {}) {
  const files = Array.from(fileList || []).slice(0, max);
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              name: file.name,
              url: reader.result,
              type,
              uploadedAt: new Date().toISOString(),
            });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );
}
