import QRCode from 'qrcode'

/** QR 코드 Data URL 생성 (서버 사이드) */
export async function generateQRDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 400,
    color: { dark: '#1e293b', light: '#ffffff' },
  })
}

/** QR 코드 SVG 문자열 생성 */
export async function generateQRSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 2 })
}

export function buildCheckinUrl(appUrl: string, publicToken: string): string {
  return `${appUrl}/e/${publicToken}/checkin`
}
