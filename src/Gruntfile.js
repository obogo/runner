module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*\n' +
            '* <%= pkg.name %> v.<%= pkg.version %>\n' +
            '* (c) ' + new Date().getFullYear() + ', Obogo\n' +
            '* License: Obogo 2014. All Rights Reserved.\n' +
            '*/\n',
        // define the ux here so that parser is scoped internally.
        wrapStart: '(function(exports, global){\n"use strict";\n',
        wrapEnd: '\n}(this.<%= pkg.packageName %> = this.<%= pkg.packageName %> || {}, function() {return this;}()));\n',
        jshint: {
            // define the files to lint
            files: ['admin/**/*.js', 'client/**/*.js', 'lib/**/*.js'],
            // configure JSHint (documented at http://www.jshint.com/docs/)
            options: {
                // more options here if you want to override JSHint defaults
                globals: {
//                    loopfunc: function (name) {} // uglify may have one too.
                },
                ignores: ['lib/parser/ux-parser.js']
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
                    '../public/client/js/<%= pkg.packageName %>-diff.js': [
                        'lib/data/*.js'
                    ],
                    '../public/client/js/<%= pkg.packageName %>-<%= pkg.filename %>-client.js': [
                        'package.js',
                        'lib/ux-dispatcher.js',
                        'lib/ux-util-array.js',
                        'lib/ux-each.js',
                        'lib/ux-extend.js',
                        'lib/data/_.js',
                        'lib/data/Inspector.js',
                        'lib/data/diff.js',
                        'client/runner/log.js',
                        'client/runner/types.js',
                        'client/runner/MethodAPI.js',
                        'client/runner/methods/*.js',
                        'client/runner/Path.js',
                        'client/runner/diffThrottle.js',
                        'client/runner/register.js',
                        'client/runner/types/step.js',
                        'client/runner/types/root.js',
                        'client/runner/types/**/*.js',
                        'client/runner/runner.js',
                        'client/runner/step.js',
                        'lib/ux-selector.js',
                        'lib/parser/ux-parser.js',
                        'lib/parser/xml2json.js'
//                        'src/recorder.js',
                    ],
                    '../public/admin/js/<%= pkg.packageName %>-<%= pkg.filename %>-admin.js': [
                        'package.js',
                        'lib/data/_.js',
                        'admin/admin.js'
                    ]
                }
            },
            build_min: {
                options: {
                    report: 'gzip',
                    banner: '<%= banner %>'
                },
                files: {
                    '../public/client/js/<%= pkg.packageName %>-<%= pkg.filename %>-client.min.js': [
                        '../public/client/js/<%= pkg.packageName %>-<%= pkg.filename %>-client.js'
                    ],
                    '../public/admin/js/<%= pkg.packageName %>-<%= pkg.filename %>-admin.min.js': [
                        '../public/admin/js/<%= pkg.packageName %>-<%= pkg.filename %>-admin.js'
                    ]
                }
            }
        },
        watch: {
            scripts: {
                files: ['admin/**/*.js', 'client/**/*.js', 'lib/**/*.js'],
                tasks: ['jshint', 'uglify'],
                options: {
                    spawn: false,
                    debounceDelay: 1000
                }
            }
        }//,
//        compress: {
//            main: {
//                options: {
//                    mode: 'gzip'
//                },
//                expand: true,
//                src: ['build/<%= pkg.filename %>.js'],
//                dest: ''
//            }
//        },
//        copy: {
//            main: {
//                files: [
//                    // include files withing path
//                    {expand: true, cwd: 'client/', src: ['client/index.html'], dest: '../public/client/index.html/'},
//                    {expand: true, cwd: 'admin/', src: ['admin/index.html'], dest: '../public/admin/index.html/'}
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