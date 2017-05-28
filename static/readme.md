# Refound front-end repository
This repo stores all static files for Refound front-end.

![Codeship](https://codeship.com/projects/b3ccb630-f8b8-0133-3fd5-32ce2850a587/status?branch=master)

----------

## Getting Started
This project requires the fallowing environment setup:

 1. Globally installed **[Node.js](https://nodejs.org/)**
    Download the installer from official [Node.js](https://nodejs.org/) site
 2. Globally installed **[Bower](http://bower.io/)**
   Easiest way to install using npm:
   ```shell
   npm install -g bower
   ```

 3. Preferred web server ([Nginx](http://nginx.org/), Apache, etc...)

All the required dependencies are stored in bower and npm package configs, so when you are ready, just install the project using npm:
```shell
npm install
```

##Configuration
Global Angular application configurations is stored in `js/settings.[env].js` files. 
By default there are two environments:

 - `settings.local.js` - used for development environment
 - `settings.prod.js` - used for production environment

####REST API
All REST API end-points are configured in Angular JS service global variables `services/*.js` or `modules/[module_name]/services/*.js`  
You should configure these end-points to refer to you server API. E.g.: 
```
var apiUrl = 'http://example.com/api/list' 
```

> **Important!** All API paths should begin with `api/` and content served as `Content-Type:application/json`.

####Version control
App versions are configured at `package.json` file. 
All versions in individual environmental settings are overrided on build, from this particular file.

##Building
Default `grunt` builds entire app and compiles all resources for development version.
Where `grunt pack` build bakes app for production.

> **Note**: Dont't forget to `npm version patch` before deploying to avoid cache related issues.

##Testing
Tests are implemented on [Jasmine](http://jasmine.github.io/) and are ran with [Karma](http://karma-runner.github.io/0.13/index.html). 
By default Karma is configured to run tests on Chrome browser using `karma-chrome-launche` but if you prefer, you can load another browser driver in `karma.conf.js` config file.

To run unit tests automatically whenever app changes use npm hook `npm test`

All tests are located in  `tests/` folder with extension `*.spec.js`. Initially there are few test examples to test controller, directive, and service - so you can use this examples to create your own tests.
All tests for the separate modules should be in separate files. E.g.: `[module name].controllers.spec.js`

##Deploying
To bake project for product environment just run `grunt pack`. It will uglify files and render required dependencies in the `index.html` file.