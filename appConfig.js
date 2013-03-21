var appConfig = {
  'port' : 3000,
  'portSSL' : 0, //3443,
  'sessionSecret' : '**PutSecretSessionDataHere**',
  'requestUrl' : 'https://api.sandbox.inbloom.org/api/rest/v1',
  'oauth' : {
    'authorizationUrl' : 'https://api.sandbox.inbloom.org/api/oauth/authorize',
    'tokenUrl' : 'https://api.sandbox.inbloom.org/api/oauth/token?grant_type=authorization_code', 
    'clientId' : '**PutYourSlcClientIdHere**',
    'clientSecret' : '**PutYourSlcSecretHere**',
    'callbackUrl' : 'http://127.0.0.1:3000/auth/slc/callback'
  }
};

module.exports = appConfig;
