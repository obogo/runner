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
                ignores: ['lib/parser/ux-parser.js', 'lib/parser/xml2json.js', 'lib/paperjs/*.js']
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
                    '../public/client/js/<%= pkg.packageName %>-<%= pkg.filename %>-client-mock.js': [
                        'client/package.js',
                        'lib/stacktrace.js',
                        'lib/ux-count.js',
                        'lib/ux-dispatcher.js',
                        'lib/ux-util-array.js',
                        'lib/ux-each.js',
                        'lib/ux-extend.js',
                        'lib/ux-charPack.js',
                        'lib/data/_.js',
                        'lib/data/Inspector.js',
                        'lib/data/diff.js',
                        'shared/events.js',
                        'shared/log.js',
                        'shared/uidToPath.js',
                        'client/runner/const.js',
                        'client/runner/invoke.js',
                        'client/runner/Path.js',
                        'client/runner/diffThrottle.js',
                        'client/runner/register.js',
                        'client/runner/types/step.js',
                        'client/runner/types/root.js',
                        'client/runner/types/**/*.js',
                        'client/runner/runner.js',
                        'client/runner/import.js',
                        'client/runner/export.js',
                        'lib/ux-selector.js',
                        'lib/parser/ux-parser.js',
                        'client/socket/mock/socket.js',
                        'socket/mock/socket.js'
//                        'src/recorder.js',
                    ],
                    '../public/client/js/<%= pkg.packageName %>-<%= pkg.filename %>-client.js': [
                        'client/package.js',
                        'lib/stacktrace.js',
                        'lib/ux-count.js',
                        'lib/ux-dispatcher.js',
                        'lib/ux-util-array.js',
                        'lib/ux-each.js',
                        'lib/ux-extend.js',
                        'lib/ux-charPack.js',
                        'lib/data/_.js',
                        'lib/data/Inspector.js',
                        'lib/data/diff.js',
                        'shared/events.js',
                        'shared/log.js',
                        'shared/uidToPath.js',
                        'client/runner/const.js',
                        'client/runner/invoke.js',
                        'client/runner/Path.js',
                        'client/runner/diffThrottle.js',
                        'client/runner/register.js',
                        'client/runner/types/step.js',
                        'client/runner/types/root.js',
                        'client/runner/types/**/*.js',
                        'client/runner/runner.js',
                        'client/runner/import.js',
                        'client/runner/export.js',
                        'lib/ux-selector.js',
                        'lib/parser/ux-parser.js',
                        'client/socket/goinstant/clientSocketConst.js',
                        'client/socket/goinstant/socketDispatch.js',
                        'client/socket/goinstant/clientSocketService.js',
                        'client/socket/goinstant/clientTrackRoomService.js',
                        'client/socket/goinstant/clientTrackRoomListeners.js'
//                        'src/recorder.js',
                    ],
                    '../public/admin/js/<%= pkg.packageName %>-<%= pkg.filename %>-admin-mock.js': [
                        'admin/package.js',
                        'admin/const.js',
                        'lib/data/_.js',
                        'lib/ux-extend.js',
                        'lib/ux-each.js',
                        'lib/ux-dispatcher.js',
                        'lib/ux-util-array.js',
                        'shared/events.js',
                        'admin/admin.js',
                        'lib/parser/xml2json.js',
                        'admin/socket/mock/socket.js',
                        'socket/mock/socket.js'
                    ],
                    '../public/admin/js/<%= pkg.packageName %>-<%= pkg.filename %>-admin.js': [
                        'admin/package.js',
                        'admin/const.js',
                        'lib/ux-extend.js',
                        'lib/ux-each.js',
                        'lib/ux-util-array.js',
                        'lib/ux-charPack.js',
                        'shared/log.js',
                        'lib/data/_.js',
                        'lib/ux-extend.js',
                        'shared/events.js',
                        'admin/admin.js',
                        'lib/parser/xml2json.js',
                        'admin/socket/goinstant/adminSocketConst.js',
                        'admin/socket/goinstant/socketDispatch.js',
                        'admin/socket/goinstant/adminSocketService.js',
                        'admin/socket/goinstant/adminTrackRoomService.js',
                        'admin/socket/goinstant/adminTrackRoomListeners.js'
                    ],
                    '../public/client/js/<%= pkg.packageName %>-<%= pkg.filename %>-recorder.js': [
                        'client/package.js',
                        'client/recorder/const.js',
                        'lib/ux-charPack.js',
                        'lib/ux-dispatcher.js',
                        'lib/ux-util-array.js',
                        'lib/ux-each.js',
                        'lib/ux-extend.js',
                        'lib/ux-filter.js',
                        'lib/ux-selector.js',//TODO: runner uses the query of selector. recorder uses the builder. maybe they should be broken out.
                        'lib/storage/localStorageManager.js',
                        'lib/data/_.js',
                        'lib/data/diff.js',
                        'shared/events.js',
                        'shared/log.js',
                        'shared/uidToPath.js',
                        'client/recorder/simplify.js',
                        'client/recorder/MousePath.js',
                        'client/recorder/storageQueue.js',
                        'client/recorder/configs/configUtils.js',
                        'client/recorder/configs/runnerConfig.js',
                        'client/recorder/recorder.js'
                    ],
                    '../public/capture/js/<%= pkg.packageName %>-<%= pkg.filename %>-recorder-capture.js': [
                        'client/package.js',
                        'client/recorder/const.js',
                        'lib/ux-charPack.js',
                        'lib/ux-dispatcher.js',
                        'lib/ux-util-array.js',
                        'lib/ux-each.js',
                        'lib/ux-extend.js',
                        'lib/ux-filter.js',
                        'lib/ux-selector.js',//TODO: Not sure this one needs selector. Unless it is going to report what was clicked on with the selector.
                        'lib/storage/localStorageManager.js',
                        'lib/data/_.js',
                        'lib/data/diff.js',
                        'shared/events.js',
                        'shared/log.js',
                        'shared/uidToPath.js',
                        'client/recorder/simplify.js',
                        'client/recorder/MousePath.js',
                        'client/recorder/storageQueue.js',
                        'client/recorder/configs/configUtils.js',
                        'client/recorder/configs/captureConfig.js',
                        'client/recorder/recorder.js'
                    ]
                }
            },
            build_min: {
                options: {
                    report: 'min',
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
                files: ['admin/**/*.js', 'client/**/*.js', 'lib/**/*.js', 'shared/**/*.js', 'GruntFile.js'],
                tasks: ['jshint', 'uglify'],
                options: {
                    spawn: false,
                    debounceDelay: 1000
                }
            }
        },
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
        copy: {
            main: {
                files: [
                    // include files withing path
                    {expand: true, cwd: '../public/client/js/', src: ['<%= pkg.packageName %>-<%= pkg.filename %>-recorder.js'], dest: '../public/tests/test1/js'}
                ]
            }
        }
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
    grunt.registerTask('default', ['jshint', 'uglify', 'copy']);

};