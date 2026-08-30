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
      /* Product videos are capped at 50 MB — keep clips short/compressed
         and use a YouTube/Vimeo link for anything bigger. */
      sizeLimit: 50 * 1024 * 1024,
      actionOptions: {
        upload:       {},
        uploadStream: {},
        delete:       {},
      },
    },
  },
});
