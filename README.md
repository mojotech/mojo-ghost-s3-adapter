# mojo-ghost-s3-adapter

A [Ghost][1] blog storage adapter to store and serve images from [AWS S3][2].

After installing, new images uploaded will use an absolute URL to your
S3 storage bucket.  Any old, existing requests to `/content/images` will be
proxied to your S3 bucket as well, so that previous images will not be affected.
This requires you to have uploaded your previous `/content/images` assets to
your S3 bucket.

## Compatibility

This adapter has been tested with Ghost 1.8.x and higher.

## Installation

Ghost storage adapters need to be installed directly in your ghost installation
content directory:

```bash
$ npm install @mojotech/mojo-ghost-s3-adapter
$ mkdir -p content/adapters/storage
$ cp -r node_modules/@mojotech/mojo-ghost-s3-compat content/adapters/storage
```
## Configuration

An [AWS IAM][3] user with `GetObject` bucket permissions is required.  You will need
the IAM users access and secret key information to configure the storage adapter.

In your Ghost configuration file, add a `storage` block for your environment:

```javascript
'storage': {
  'active': 'mojo-ghost-s3-adapter',
  'mojo-ghost-s3-adapter': {
    'accessKeyId': '<ACCESS_KEY_ID>',
    'secretAccessKey': '<SECRET_ACCESS_KEY>',
    'bucket': '<S3_BUCKET_NAME>',
    'region': '<S3_REGION_NAME>'
  }
}
```

### Asset host

If you use a CDN such as CloudFront or CloudFlare you can add an optional
`assetHost` key to your `storage` configuration with the virtual host url
of your CDN.

```javascript
  assetHost: 'https://cdn.yourdomain.com/'
```

## Contributing

Bug reports and Pull Requests are welcome at https://github.com/mojotech/mojo-ghost-s3-adapter. This project
is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the
[Contributor Covenant][4] [Code of Conduct](CODE_OF_CONDUCT.md).

## Copyright & License

Copyright (c) 2017 MojoTech, LLC.

Released under the [MIT license](LICENSE.md).

[1]: https://ghost.org/
[2]: https://aws.amazon.com/s3/
[3]: https://aws.amazon.com/iam/
[4]: https://www.contributor-covenant.org/
