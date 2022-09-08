[![Docker](https://github.com/Samagra-Development/esamwad-user-service/actions/workflows/docker.yml/badge.svg)](https://github.com/Samagra-Development/esamwad-user-service/actions/workflows/docker.yml)
[![Node.js CI](https://github.com/Samagra-Development/esamwad-user-service/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/Samagra-Development/esamwad-user-service/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/Samagra-Development/esamwad-user-service/badge.svg?branch=master)](https://coveralls.io/github/Samagra-Development/esamwad-user-service?branch=master)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=Samagra-Development_esamwad-user-service&metric=code_smells)](https://sonarcloud.io/dashboard?id=Samagra-Development_esamwad-user-service)

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Description

[Nest](https://github.com/nestjs/nest) service for managing eSamwad Users.

## Installation

```bash
$ yarn install
```

_Note_: This project is built on VSCode and would be developed only with this IDE in mind. The [.vscode directory](./.vscode) will be kept updated with all the VSCode magic 🧙‍♂️.

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# debug mode
$ yarn start:debug

# production mode
$ yarn start:prod
```

## Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov

# test a single file
$ yarn run test:watch ./src/user/sms/gupshup/gupshup.service.spec.ts
```

## Add a sample service
```bash
# open .env file
$ vi .env

# add your service info in below format
application_id={"host": "dummy.com", "apiKey": "zse12344@#%ddsr", "encryption": {"enabled": true, "key": "veryhardkey"}}
# where apiKey and encryption.key is not mandatory
# Precedence will be given apiKey sent in Authorization header (Check swagger collection below for references)
# encryption.enabled provides option to encrypt username/password with the provided enrption.key before sending to the FA server.

# restart docker-compose
$ docker-compose down
$ docker-compose up -d --build
```

## Postman Collection

Find [here](https://www.getpostman.com/collections/273dc33e3e37977a22b5)

## Stay in touch

- Author - [Radhay Anand](https://github.com/radhay-samagra)

## License

Nest is [MIT licensed](LICENSE).

## Support

This project was bootstrapped using Nest. Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).
