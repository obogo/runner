module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*\n' +
            '* <%= pkg.name %> v.<%= pkg.version %>\n' +
            '* (c) ' + new Date().getFullYear() + ', WebUX\n' +
            '* License: MIT.\n' +
            '*/\n',
        wrapStart: '(function(exports, global){\n',
        wrapEnd: '\n}(this.<%= pkg.packageName %> = this.<%= pkg.packageName %> || {}, function() {return this;}()));\n',
        jshint: {
            // define the files to lint
            files: ['src/**/*.js'],
            // configure JSHint (documented at http://www.jshint.com/docs/)
            options: {
                // more options here if you want to override JSHint defaults
                globals: {
//                    loopfunc: function (name) {} // uglify may have one too.
                },
                ignores: ['src/lib/porthole.js']
            }
        },
        uglify: {
            build: {
                options: {
                    mangle: false,
                    compress: false,
                    preserveComments: 'some',
                    beautify: true,
                    banner: '<%= banner %><%= wrapStart %>',
                    footer: '<%= wrapEnd %>'
                },
                files: {
                    'build/ux-<%= pkg.filename %>.js': [
                        'src/package.js',
                        'src/lib/ux-dispatcher.js',
//                        'src/lib/ux-selector.js',
                        'src/lib/data/*.js',
                        'src/lib/ux-util-array.js',
                        'src/lib/ux-each.js',
                        'src/lib/ux-extend.js',
                        'src/runner/log.js',
                        'src/runner/types.js',
                        'src/runner/step.js',
                        'src/runner/MethodAPI.js',
                        'src/runner/Path.js',
                        'src/runner/runner.js'
//                        'src/recorder.js',
//                        'src/renderer.js',
//                        'src/actions/*.js',
//                        'src/expects/*.js'
                    ],
                    'build/ux-<%= pkg.filename %>-host.js': [
                        'src/package.js',
                        'src/lib/porthole.js',
                        'src/config.js',
                        'src/lib/ux-util-array.js',
                        'src/lib/ux-extend.js',
                        'src/util.js',
                        'src/messenger/proxy.js',
                        'src/messenger/host.js'
                    ],
                    'build/ux-<%= pkg.filename %>-guest.js': [
                        'src/package.js',
                        'src/lib/porthole.js',
                        'src/config.js',
                        'src/lib/ux-util-array.js',
                        'src/lib/ux-extend.js',
                        'src/util.js',
                        'src/messenger/proxy.js',
                        'src/messenger/guest.js'
                    ]
                }
            },
            build_min: {
                options: {
                    report: 'gzip',
                    banner: '<%= banner %>'
                },
                files: {
                    'build/ux-<%= pkg.filename %>.min.js': ['build/ux-<%= pkg.filename %>.js']
                }
            },
            build_ng: {
                options: {
                    mangle: false,
                    compress: false,
                    preserveComments: 'some',
                    beautify: true,
                    banner: '<%= banner %><%= wrapStart %>',
                    footer: '<%= wrapEnd %>'
                },
                files: {
                    'build/angular-<%= pkg.filename %>.js': [
                        'src/lib/*.js',
                        'src/ux-runner.js',
                        'src/renderer.js',
                        'src/actions/*.js',
                        'src/expects/*.js',
                        'src/frameworks/angular.js',
                    ]
                }
            },
            build_ng_min: {
                options: {
                    report: 'gzip',
                    banner: '<%= banner %>'
                },
                files: {
                    'build/angular-<%= pkg.filename %>.min.js': ['build/angular-<%= pkg.filename %>.js']
                }
            }
        },
        watch: {
            scripts: {
                files: 'src/**/*.js',
                tasks: ['jshint', 'uglify'],
                options: {
                    spawn: false,
                    debounceDelay: 1000
                }
            }
        },
        compress: {
            main: {
                options: {
                    mode: 'gzip'
                },
                expand: true,
                src: ['build/<%= pkg.filename %>.js'],
                dest: ''
            }
        },
//        copy: {
//            main: {
//                files: [
//                    // include files withing path
//                    {expand: true, cwd: 'build/latest/', src: ['**'], dest: 'build/v<%= pkg.version %>/'}
//                ]
//            }
//        }
    });


    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-ngmin');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
//    grunt.registerTask('default', ['jshint', 'uglify', 'compress']);
    grunt.registerTask('default', ['jshint', 'uglify']);//, 'copy']);

};