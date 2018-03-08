module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-package-modules');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-multi-dest');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-force-task');
  grunt.loadNpmTasks('grunt-contrib-jshint');


  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    clean: ["dist"],

    jshint: {
      options: {
        jshintrc: '.jshintrc',
        ignores: ['src/bower_components/**', 'src/**/external/**'],
      },
      src: ['Gruntfile.js', 'src/**/*.js'],
    },

    jscs: {
      src: ['src/**/*.js', '!src/external/d3.v3.min.js'],
      options: {
        config: ".jscs.json",
      },
    },

    copy: {
      main: {
        cwd: 'src',
        expand: true,
        src: ['**/*', '!**/*.js', '!**/*.ts', '!**/*.scss'],
        dest: 'dist'
      },
      externals: {
        cwd: 'src',
        expand: true,
        src: ['**/external/*'],
        dest: 'dist'
      },
      bower_libs: {
        cwd: 'bower_components',
        expand: true,
        src: ['d3', 'font-awesome'],
        dest: 'dist/libs/'
      },
      pluginDef: {
        expand: true,
        src: ['README.md'],
        dest: 'dist',
      }
    },

    multidest: {
        copy_some_files: {
            tasks: [
                "copy:main",
                "copy:externals",
                "copy:pluginDef"
            ],
            dest: ["dist"]
        },
    },

    packageModules: {
        dist: {
          src: 'package.json',
          dest: 'dist/src'
        },
    },

    concat: {
      dist: {
        src: ['src/node_modules/**/*.js'],
        dest: 'dist/src/<%= pkg.namelower %>-<%= pkg.version %>.js'
      }
    },

    watch: {
      rebuild_all: {
        files: ['src/**/*', 'README.md', '!src/node_modules/**', '!src/bower_components/**'],
        tasks: ['default'],
        options: {spawn: false}
      },
    },

    babel: {
      options: {
        ignore: ['**/bower_components/*','**/external/*'],
        sourceMap: true,
        presets:  ["env"],
      },
      dist: {
        files: [{
          cwd: 'src',
          expand: true,
          src: ['**/*.js'],
          dest: 'dist',
          ext:'.js'
        }]
      },
    },

  });


  grunt.registerTask('default', [
          'jshint',
          'jscs',
          'multidest',
          'copy:bower_libs',
          'babel']);
  grunt.registerTask('release', ['jshint', 'clean', 'multidest', 'copy:bower_libs', 'packageModules', 'babel']);
};
