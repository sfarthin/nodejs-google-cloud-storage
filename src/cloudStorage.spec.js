/*jshint expr: true*/

var rest = require('quinncia-restler'),
  CloudStorage = require('./cloudStorage')(
    process.env.GCS_PRIVATE_KEY ||
      require('path').resolve(__dirname, '../google-services-private-key.pem'),
  ),
  _ = require('underscore'),
  jade = require('jade'),
  chai = require('chai'),
  expect = chai.expect;

// Lets set our default acl

describe('CloudStorage', function() {
  var filePath = __dirname + '/test.txt',
    testKey = 'test/test-' + Date.now() + '.txt',
    testKey2 = 'test/test-' + Date.now() + '-2.txt',
    testKey3 = 'test/test-' + Date.now() + '-3.txt',
    testKey4 = 'test/test-' + Date.now() + '-4.txt',
    testKey5 = 'test/test-' + Date.now() + '-5.txt',
    testKey6 = 'test/test-' + Date.now() + '-6.txt';

  before(function(done) {
    this.timeout(15 * 1000);

    var callback = _.after(2, done);

    // Lets open up our cors so we don't get any errors uploading from the browser.
    CloudStorage.cors(jade.renderFile(__dirname + '/cors.jade', {}), callback);
    CloudStorage.defaultAcl('public-read', callback);
  });

  it('can check if a file exists', function(done) {
    // Lets see if the file exists
    CloudStorage.exists(testKey, function(exists) {
      expect(exists).to.be.false;
      done();
    });
  });

  it('can upload a file (as attachment) and confirm that its publicly accessible', function(done) {
    this.timeout(15 * 1000);

    // Lets upload a file as attachment.
    CloudStorage.upload(filePath, testKey, true, null, function(success) {
      expect(success).to.be.true;

      // Lets confirm that the file is there
      CloudStorage.exists(testKey, function(exists) {
        expect(exists).to.be.true;

        // Lets access this file via a public url
        rest
          .get(CloudStorage.getPublicUrl(testKey))
          .on('complete', function(data, res) {
            // Expect to see the text content
            expect(data).to.equal('Hello World');

            // Lets make sure this is set to download as an attachment
            expect(res.headers['content-disposition']).to.equal(
              'attachment; filename=test.txt',
            );

            done();
          });
      });
    });
  });

  it('can remove an existing file', function(done) {
    this.timeout(15 * 1000);

    // Lets confirm the file exists
    CloudStorage.exists(testKey, function(exists) {
      expect(exists).to.be.true;

      // Lets remove it.
      CloudStorage.remove(testKey, function() {
        // Lets make sure its gone.
        CloudStorage.exists(testKey, function(exists) {
          expect(exists).to.be.false;
          done();
        });
      });
    });
  });

  it('can make a file private and accessible with a private url', function(done) {
    this.timeout(15 * 1000);

    // Lets upload a brand new file to make sure nothing is cached.
    CloudStorage.upload(filePath, testKey2, true, null, function() {
      // Lets make it private.
      CloudStorage.makePrivate(testKey2, function() {
        // Lets confirm the file exists
        CloudStorage.exists(testKey2, function(exists) {
          expect(exists).to.be.true;

          // Lets access this file via a public url
          rest
            .get(CloudStorage.getPublicUrl(testKey2))
            .on('complete', function(data, res) {
              expect(res.statusCode).to.equal(403);

              // Lets access via a private url
              rest
                .get(CloudStorage.getPrivateUrl(testKey2))
                .on('complete', function(data, res) {
                  // Expect to see the text content
                  expect(data).to.equal('Hello World');

                  expect(res.statusCode).to.equal(200);
                  done();
                });
            });
        });
      });
    });
  });

  it('can make a file private and then public again', function(done) {
    this.timeout(15 * 1000);

    // Lets upload a brand new file to make sure nothing is cached.
    CloudStorage.upload(filePath, testKey3, true, null, function() {
      // Lets make it private.
      CloudStorage.makePrivate(testKey3, function() {
        // Lets make it public.
        CloudStorage.makePublic(testKey3, function() {
          // Lets access this file via a public url
          rest
            .get(CloudStorage.getPublicUrl(testKey3))
            .on('complete', function(data, res) {
              // Expect to see the text content
              expect(data).to.equal('Hello World');

              expect(res.statusCode).to.equal(200);
              done();
            });
        });
      });
    });
  });

  it('can upload a file (as inline) and confirm that its publicly accessible and displayed as inline', function(done) {
    this.timeout(15 * 1000);

    // Lets upload a file as attachment.
    CloudStorage.upload(filePath, testKey4, false, null, function(success) {
      expect(success).to.be.true;

      // Lets confirm that the file is there
      CloudStorage.exisits(testKey4, function(exists) {
        expect(exists).to.be.true;

        // Lets access this file via a public url
        rest
          .get(CloudStorage.getPublicUrl(testKey4))
          .on('complete', function(data, res) {
            // Lets make sure this is set to download as an attachment
            expect(res.headers['content-disposition']).to.be.undefined;

            done();
          });
      });
    });
  });

  it('can set custom x-goog-meta header', function(done) {
    this.timeout(15 * 1000);

    // Lets upload a file as attachment.
    CloudStorage.upload(
      filePath,
      testKey5,
      false,
      { example: 'this is some text' },
      function(success) {
        expect(success).to.be.true;

        // Lets access this file via a public url
        rest
          .get(CloudStorage.getPublicUrl(testKey5))
          .on('complete', function(data, res) {
            // Expect to see the meta data in the header
            expect(res.headers['x-goog-meta-example']).to.equal(
              'this is some text',
            );

            done();
          });
      },
    );
  });

  it('can set a Cache-Control', function(done) {
    this.timeout(15 * 1000);

    // Lets upload a file as attachment.
    CloudStorage.upload(
      filePath,
      testKey6,
      false,
      { 'Cache-Control': 'private, max-age=0, no-transform' },
      function(success) {
        expect(success).to.be.true;

        // Lets access this file via a public url
        rest
          .get(CloudStorage.getPublicUrl(testKey6))
          .on('complete', function(data, res) {
            // Expect to see the meta data in the header
            expect(res.headers['cache-control']).to.equal(
              'private, max-age=0, no-transform',
            );

            var cleanup = _.after(4, function() {
              done();
            });

            CloudStorage.remove(testKey2, cleanup);
            CloudStorage.remove(testKey3, cleanup);
            CloudStorage.remove(testKey4, cleanup);
            CloudStorage.remove(testKey5, cleanup);
          });
      },
    );
  });
});
