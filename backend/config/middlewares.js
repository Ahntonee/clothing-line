'use strict';

module.exports = ({ env }) => {
  const frontendUrls = env('FRONTEND_URLS', 'http://localhost:3000')
    .split(',')
    .map(u => u.trim())
    .filter(Boolean);

  return [
    'strapi::logger',
    'strapi::errors',
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'connect-src': ["'self'", 'https:'],
            'img-src': [
              "'self'",
              'data:',
              'blob:',
              '*.digitaloceanspaces.com',
              '*.cdn.digitaloceanspaces.com',
              'market-assets.strapi.io',
            ],
            'media-src': [
              "'self'",
              'data:',
              'blob:',
              '*.digitaloceanspaces.com',
              '*.cdn.digitaloceanspaces.com',
            ],
            'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            upgradeInsecureRequests: null,
          },
        },
      },
    },
    {
      name: 'strapi::cors',
      config: {
        enabled: true,
        headers: '*',
        origin: [
          'http://localhost:1337',
          'http://127.0.0.1:1337',
          'https://frankoclothing.com',
          'https://www.frankoclothing.com',
          ...frontendUrls,
        ],
      },
    },
    'strapi::poweredBy',
    'strapi::query',
    {
      name: 'strapi::body',
      config: {
        formLimit: '100mb',
        jsonLimit: '10mb',
        textLimit: '10mb',
        formidable: {
          maxFileSize: 100 * 1024 * 1024, // 100 MB — product video uploads
        },
      },
    },
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};
