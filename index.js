'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const S3 = require('aws-sdk/clients/s3');
const https = require('https');
const Promise = require('bluebird');
const isEmpty = require('lodash/isEmpty');

const BaseAdapter = require('ghost-storage-base');

class MojoGhostS3Adapter extends BaseAdapter {
    // `s3Client` allows for Dependency injection for testing
    constructor(config, s3Client) {
        super();

        if (!config || isEmpty(config.bucket)) {
            return reject('invalid mojo-ghost-s3-adapter config - bucket is required');
        }

        if (isEmpty(config.region)) {
            return reject('invalid mojo-ghost-s3-adapter config - region is required');
        }

        if (isEmpty(config.accessKeyId) || isEmpty(config.secretAccessKey)) {
            return reject('invalid mojo-ghost-s3-adapter config - accessKeyId and secretAccessKey are required');
        }

        this.config = config;
        this.assetHost = config.asssetHost ? config.assetHost : util.format('https://s3.%s.amazonaws.com/%s', config.region, config.bucket);
        this.imageCacheMaxAge = 1000 * 365 * 24 * 60 * 60; // 365 days
        this._s3Client = s3Client ? s3Client : new S3({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            bucket: config.bucket,
            region: config.region
        });
    }

    exists(fileName) {
        return new Promise(function (resolve, reject) {
            https.get(fileName, function(res) {
                resolve(200 === res.statusCode);
            });
        });
    }

    save(image, targetDir) {
        const config = this.config;
        const s3 = this._s3Client;
        const cacheMaxAge = this.imageCacheMaxAge;
        const assetHost = this.assetHost;
        const curDate = new Date();

        return new Promise(function(resolve, reject) {
            const stream = fs.createReadStream(image.path, { autoClose: true });
            const targetFolder = path.join(config.folder || '', util.format('%s/%s/%s', curDate.getFullYear(), curDate.getMonth(), curDate.getDate()));
            const formattedFilename = path.parse(image.originalname);
            const targetFilename = formattedFilename.name + formattedFilename.ext;
            const targetKey = path.join(targetFolder, targetFilename);

            console.log('mojo-ghost-s3-adapter: putObject', image.path, config.bucket, targetKey);

            const s3Params = {
                ACL: 'public-read',
                Body: stream,
                Bucket: config.bucket,
                Key: targetKey,
                ContentType: image.type,
                CacheControl: 'max-age=' + cacheMaxAge
            };
            s3.putObject(s3Params, function(error, data) {
                if (error) {
                    return reject(error);
                }

                // return resolve(util.format('https://s3.%s.amazonaws.com/%s/%s', config.region, config.bucket, targetKey));
                return resolve(util.format('%s/%s', assetHost, targetKey));
            });
        });
    }

    // Middleware for serving image files that used to be served from content/images
    // * We uploaded all those images to S3, but the post content still references theme locally,
    //   so we proxy that request to S3 instead now.
    serve() {
        const config = this.config;
        const s3 = this._s3Client;

        return function customServe(req, res, next) {
            const s3Params = {
                Bucket: config.bucket,
                Key: req.path.replace(/(^\/)|(\/$)/g, '')
            };

            s3.getObject(s3Params)
            .on('httpHeaders', function(statusCode, headers, response) {
                res.set(headers);
            })
            .createReadStream()
            .on('error', function(err) {
                console.log('mojo-ghost-s3-adapter: serve#error', err);
                res.status(404);
                next();
            })
            .pipe(res);
        }
    }

    delete() {
        return Promise.reject('not implemented');
    }

    read() {
        return Promise.reject('not implemented');
    }
}

module.exports = MojoGhostS3Adapter;
