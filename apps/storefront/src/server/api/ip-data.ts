import { get } from 'node:https';

type IpWhoIsResponse = {
  success: boolean
  message?: string
  city?: string
  region?: string
  country?: string
  currency_code?: string
  currency?: {
    code?: string
  }
  flag?: {
    emoji?: string
  }
};

const isPublicIp = (ip?: string | null) => {
  if (!ip) return false;

  return ![
    ip === '127.0.0.1',
    ip === '::1',
    ip.startsWith('::ffff:127.'),
    ip.startsWith('10.'),
    ip.startsWith('192.168.'),
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip),
    ip.startsWith('fc'),
    ip.startsWith('fd'),
    ip.startsWith('fe80:'),
  ].some(Boolean);
};

const fetchIpWhoIs = (url: string) =>
  new Promise<{ statusCode: number, data: IpWhoIsResponse }>((resolve, reject) => {
    get(
      url,
      {
        headers: {
          accept: 'application/json',
        },
      },
      (response) => {
        let body = '';

        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          try {
            resolve({
              statusCode: response.statusCode || 500,
              data: JSON.parse(body) as IpWhoIsResponse,
            });
          }
          catch (error) {
            reject(error);
          }
        });
      }
    ).on('error', reject);
  });

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true });
  // Loopback and private IPs are common in local development and cannot be
  // geolocated meaningfully by the upstream service.
  const endpoint = isPublicIp(ip) ? `https://ipwho.is/${ip}` : 'https://ipwho.is';

  const { statusCode, data } = await fetchIpWhoIs(endpoint);

  if (statusCode >= 400 || !data.success) {
    throw createError({
      statusCode: 502,
      statusMessage: data.message || 'Failed to resolve IP data',
    });
  }

  return {
    city: data.city || '',
    region: data.region || '',
    country_name: data.country || '',
    currency: {
      code: data.currency?.code || data.currency_code || '',
    },
    emoji_flag: data.flag?.emoji || '',
  };
});
