module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                sourceMap: true
            },
            target: {
                files: [{
                    expand: true,
                    cwd: 'compiled/js',
                    src: ['*.js', '!*.min.js'],
                    dest: 'compiled/js',
                    ext: '.min.js'
                }]
            }
        },
        concat: {
            js: {
                files: {
                    'compiled/js/main.js': ['js/*.js', '!js/settings.local.js', '!js/newrelic*', '!js/tracking.js'], //Exclude local config file
                    'compiled/js/services.js': ['js/services/*.js'],
                    'compiled/js/controllers.js': ['js/controllers/*.js'],
                    'compiled/js/directives.js': ['js/directives/*.js'],
                    'compiled/js/filters.js': ['js/filters/*.js'],
                },
            }
        },
        less: {
            target: {
                options: {
                    paths: ['less', 'modules/*/less']
                },
                files: [{
                    expand: true,
                    cwd: 'less',
                    src: ['main.less'],
                    dest: 'css',
                    ext: '.css'
                }, {
                    expand: true,
                    src: ['modules/*/less/main.less'],
                    ext: '.css',
                    rename: function (dest, src) {
                        return src.replace('less', 'css');
                    },
                }]
            }
        },
        cssmin: {
            target: {
                options: {
                    sourceMap: true
                },
                files: [{
                    expand: true,
                    cwd: 'css',
                    src: ['*.css', '!*.min.css'],
                    dest: 'css',
                    ext: '.min.css'
                }, {
                    expand: true,
                    src: ['modules/*/css/main.css'],
                    ext: '.min.css'
                }]
            }
        },
        injector: {
            options: {
                bowerPrefix: 'bower-',
                addRootSlash: false,
                template: 'views/index.html',
                transform: function (filename, i, length) {

                    var isPackTask = grunt.cli.tasks.indexOf('pack') > -1;
                    var versionParam = '?v=' + grunt.config('pkg.version');

                    //Don't add version for bower components
                    if (filename.indexOf('bower_components') === 0) {
                        versionParam = '?v=' + grunt.config('pkg.depVersion');
                    };

                    //Files that will be converted to inline scripts
                    switch (filename) {
                        case 'js/tracking.js':

                            if (isPackTask) {
                                return '<script src="' + filename + '" data-embed></script>';
                            } else {
                                return '<script src="' + filename + versionParam + '" data-embed></script>';
                            };
                    };

                    //Add version
                    switch (filename.substr(filename.lastIndexOf('.') + 1)) {
                        case 'js':
                            return '<script src="' + filename + versionParam + '"></script>';

                        case 'css':
                            return '<link rel="stylesheet" href="' + filename + versionParam + '">';
                    };
                }
            },
            bower_dependencies: {
                files: {
                    'index.html': ['bower.json'],
                }
            },
            local: {
                files: {
                    'index.html': [
                        'bower.json',
                        'js/*.js',
                        'modules/*/*.js',
                        'modules/*/*/*.js',
                        'js/services/*.js',
                        'js/controllers/*.js',
                        'js/directives/*.js',
                        'js/filters/*.js',
                        '!js/settings.prod.js', //Exclude production config file
                        'css/main.css',
                        '!js/newrelic*',
                        '!js/tracking.js'
                    ],
                }
            },
            tracking: {
                options: {
                    starttag: '<!-- injector:trackers -->',
                    endtag: '<!-- endinjector -->',
                    template: 'index.html',
                },
                files: {
                    'index.html': [
                        'js/tracking.js'
                    ]
                }
            },
            newrelic_production: {
                options: {
                    starttag: '<!-- injector:newrelic -->',
                    endtag: '<!-- endinjector -->'
                },
                files: {
                    'index.html': [
                        'js/newrelic_browser_production.js'
                    ]
                }
            },
            newrelic_local: {
                options: {
                    starttag: '<!-- injector:newrelic -->',
                    endtag: '<!-- endinjector -->'
                },
                files: {
                    'index.html': [
                        'js/newrelic_browser_testing.js'
                    ]
                }
            },
            production: {
                options: {
                    min: true
                },
                files: {
                    'index.html': [
                        'bower.json',
                        'compiled/js/main.min.js',
                        'compiled/js/services.min.js',
                        'compiled/js/controllers.min.js',
                        'compiled/js/directives.min.js',
                        'compiled/js/filters.min.js',
                        'compiled/js/modules.min.js',
                        'css/main.min.css'
                    ],
                }
            }
        },
        embed: {
            options: {
                threshold: '0'
            },
            production: {
                files: {
                    'index.html': 'index.html'
                }
            }
        },
        'regex-replace': {
            local: {
                src: ['js/settings.local.js'],
                actions: [{
                    name: 'Version pump up',
                    search: 'version:(\\s)\'[0-9]*\.[0-9]*\.[0-9]*\'',
                    replace: function() {
                        return 'version: \'' + grunt.config('pkg.version') + '\'';
                    },
                    flags: 'g'
                }]
            },
            prod: {
                src: ['js/settings.prod.js'],
                actions: [{
                    name: 'Version pump up',
                    search: 'version:(\\s)\'[0-9]*\.[0-9]*\.[0-9]*\'',
                    replace: function() {
                        return 'version: \'' + grunt.config('pkg.version') + '\'';
                    },
                    flags: 'g'
                }]
            }
        }
    });


    // Load grunt plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-regex-replace');
    grunt.loadNpmTasks('grunt-injector');
    grunt.loadNpmTasks('grunt-embed');


    // Default task(s).
    grunt.registerTask('default', ['regex-replace:local', 'less', 'injector:local', 'injector:tracking', 'injector:newrelic_local']);
    grunt.registerTask('pack', ['regex-replace:prod', 'concat:js', 'uglify', 'less', 'cssmin', 'injector:production', 'injector:tracking', 'injector:newrelic_production', 'embed:production']);
    grunt.registerTask('inject', ['injector:local']);
    grunt.registerTask('css', ['less']);
};
