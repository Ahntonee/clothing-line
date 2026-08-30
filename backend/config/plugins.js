'use strict';

module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          credentials: {
            accessKeyId:     env('DO_SPACES_KEY'),
            secretAccessKey: env('DO_SPACES_SECRET'),
          },
          endpoint: `https://${env('DO_SPACES_REGION', 'nyc3')}.digitaloceanspaces.com`,
          region:   env('DO_SPACES_REGION', 'nyc3'),
          params: {
            ACL:    'public-read',
            Bucket: env('DO_SPACES_BUCKET'),
          },
        },
      },
      /* Allow larger files (product videos). ~100 MB —
         keep clips short/compressed; use a YouTube/Vimeo link for anything bigger. */
      sizeLimit: 100 * 1024 * 1024,
      actionOptions: {
        upload:       {},
        uploadStream: {},
        delete:       {},
      },
    },
  },
});
