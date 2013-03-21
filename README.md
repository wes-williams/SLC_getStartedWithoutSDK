SLC_getStartedWithoutSDK
============================

Example SLC app using common node modules

Get Started
------------
  * install node binaries from nodejs.org
  * git clone ${THIS_PROJECT_GITHUB_REPO}
  * cd ${THIS_PROJECT_NAME}
  * npm install
  * change slc specific values in appConfig.js
  * node example.js

SSL Setup (Recommended)
------------
  * mkdir ssl
  * cd ssl
  * openssl genrsa -out privatekey.pem 1024
  * openssl req -new -key privatekey.pem -out certrequest.csr
  * openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem
  * change portSSL in appConfig.js to non-zero value
