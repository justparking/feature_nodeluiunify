module.exports = function(grunt) {
  //Initializing the configuration object
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    replace: {
      fontawesome: {
        src: ['./node_modules/@fortawesome/fontawesome-free/css/all.css'],
        dest: './node_modules/@fortawesome/fontawesome-free/css/all.local.css',
        replacements: [{
          from: 'webfonts',
          to: 'fonts'
        }]
      }
    },
    twbs: {
      dark: {
        options: {
          bootstrap: './node_modules/bootstrap',
          less: './custom/dark/'
        }
      },
      light: {
        options: {
          bootstrap: './node_modules/bootstrap',
          less: './custom/light/'
        }
      }
    },
    copy: {
      updatetheme: {
        files: [
          {
            src: 'custom/theme.less',
            dest: 'custom/light/theme.less'
          },
          {
            src: 'custom/theme.less',
            dest: 'custom/dark/theme.less'
          }
        ]
      },
      main: {
        files: [
          {
            expand: true,
            cwd: './node_modules/@fortawesome/fontawesome-free/webfonts/',
            src: '**',
            dest: 'build/fonts/',
            flatten: true, 
            filter: 'isFile'
          },
          {
            expand: true,
            cwd: './node_modules/bootstrap/dist/fonts/',
            src: '**',
            dest: 'build/fonts/',
            flatten: true, 
            filter: 'isFile'
          },
          {
            src: 'custom/main.css',
            dest: 'build/css/main-sample.css'
          },
          {
            src: 'custom/main.js',
            dest: 'build/js/main.js'
          },
          {
            src: 'custom/index.xml',
            dest: 'build/index-sample.xml'
          },
          {
            src: 'custom/index.xsd',
            dest: 'build/index.xsd'
          },
          {
            src: 'custom/index.xsl',
            dest: 'build/index.xsl'
          },
          {
            src: 'custom/index.htm',
            dest: 'build/index.htm'
          },
          {
            src: 'custom/index.smil',
            dest: 'build/index-sample.smil'
          },
          {
            src: 'custom/templates.xsl',
            dest: 'build/templates.xsl'
          },
          {
            src: 'custom/status.xml',
            dest: 'build/status-sample.xml'
          },
          {
            src: 'custom/nodel.xml',
            dest: 'build/nodel.xml'
          },
          {
            src: 'custom/nodes.xml',
            dest: 'build/nodes.xml'
          },
          {
            src: 'custom/toolkit.xml',
            dest: 'build/toolkit.xml'
          },
          {
            src: 'custom/diagnostics.xml',
            dest: 'build/diagnostics.xml'
          },
          {
            src: 'custom/schemas.json',
            dest: 'build/schemas.json'
          },
          {
            src: 'custom/logo.png',
            dest: 'build/img/logo.png'
          },
          {
            src: 'custom/custom-sample.py',
            dest: 'build/custom-sample.py'
          },
          {
            src: 'custom/favicon.ico',
            dest: 'build/img/favicon.ico'
          }
        ]
      }
    },
    concat_css: {
      options: {},
      dark: {
        src: [
          './node_modules/@fortawesome/fontawesome-free/css/all.local.css',
          './node_modules/bootstrap/dist/css/bootstrap.css',
          './node_modules/bootstrap/dist/css/bootstrap-theme.css',
          './node_modules/jquery.scrollbar/jquery.scrollbar.css',
          './node_modules/codemirror/lib/codemirror.css',
          './node_modules/codemirror/addon/dialog/dialog.css'
        ],
        dest: './build/css/components.css'
      },
      light: {
        src: [
          './node_modules/@fortawesome/fontawesome-free/css/all.local.css',
          './node_modules/bootstrap/dist/css/bootstrap.css',
          './node_modules/bootstrap/dist/css/bootstrap-theme.css',
          './node_modules/jquery.scrollbar/jquery.scrollbar.css',
          './node_modules/codemirror/lib/codemirror.css',
          './node_modules/codemirror/addon/dialog/dialog.css'
        ],
        dest: './build/css/components.default.css'
      }
    },
    run: {
      lodash: {
        exec: 'lodash -d -o "./temp/lodash.build.js" --silent'
      }
    },
    concat: {
      options: {
        separator: ';'
      },
      js_main: {
        src: [
          './node_modules/jquery/dist/jquery.js',
          './node_modules/jsviews/jsviews.js',
          './node_modules/bootstrap/dist/js/bootstrap.js',
          './node_modules/moment/moment.js',
          './node_modules/jquery.scrollbar/jquery.scrollbar.js',
          './node_modules/pagedown/Markdown.Converter.js',
          './node_modules/xregexp/xregexp-all.js',
          './node_modules/gsap/umd/CSSPlugin.js',
          './node_modules/gsap/umd/EasePack.js',
          './node_modules/gsap/umd/TweenLite.js',
          './node_modules/gsap/umd/jquery.gsap.js',
          './node_modules/fuzzyset.js/lib/fuzzyset.js',
          './node_modules/codemirror/lib/codemirror.js',
          './node_modules/codemirror/addon/display/autorefresh.js',
          './node_modules/codemirror/addon/edit/matchbrackets.js',
          './node_modules/codemirror/addon/search/searchcursor.js',
          './node_modules/codemirror/addon/search/search.js',
          './node_modules/codemirror/addon/dialog/dialog.js',
          './node_modules/codemirror/addon/search/jump-to-line.js',
          './node_modules/codemirror/mode/python/python.js',
          './node_modules/codemirror/mode/javascript/javascript.js',
          './node_modules/codemirror/mode/xml/xml.js',
          './node_modules/codemirror/mode/css/css.js',
          './node_modules/codemirror/mode/clike/clike.js',
          './node_modules/codemirror/mode/groovy/groovy.js',
          './node_modules/codemirror/mode/sql/sql.js',
          './node_modules/codemirror/mode/shell/shell.js',
          './node_modules/cm-resize/dist/cm-resize.js',
          './node_modules/array.findindex/src/array-find-index-polyfill.js',
          './node_modules/identicon.js/identicon.js',
          './node_modules/xxhashjs/build/xxhash.js',
          './node_modules/google-charts/dist/googleCharts.js',
          './temp/lodash.build.js'
        ],
        dest: './build/js/components.js'
      }
    },
    uglify: {  
      options: {  
        compress: true  
      },  
      applib: {  
        src: './build/js/components.js',
        dest: './build/js/components.min.js'  
      }
    },
    xsltproc: {
      compile: {
        files: {
          './build/index-sample.xml.htm': ['./dist/index-sample.xml']
        }
      }
    },
    prettify: {
      html: {
        files: {
          './build/index-sample.xml.htm': ['./dist/index-sample.xml.htm']
        }
      }
    },
    'npm-command': {
      foobar: {
        options: {
          cwd: 'node_modules/codemirror/'
        }
      }
    }
  });
  // Plugin loading
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-concat-css');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-sftp-deploy');
  grunt.loadNpmTasks('grunt-twbs');
  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-xsltproc');
  grunt.loadNpmTasks('grunt-prettify');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-npm-command');
  // Task definition
  grunt.registerTask('default', ['npm-command', 'run:lodash', 'copy:updatetheme','replace','twbs:dark','concat_css:dark','twbs:light','concat_css:light','copy:main','concat','uglify']);
  grunt.registerTask('build', ['copy:updatetheme','replace','twbs:dark','concat_css:dark','twbs:light','concat_css:light','copy:main','concat','uglify']);
  grunt.registerTask('lodash', ['run:lodash']);
  grunt.registerTask('codemirror', ['npm-command']);
  //grunt.registerTask('deploy', ['copy:main','sftp-deploy']);
  grunt.registerTask('deploy', ['copy:main']);
  grunt.registerTask('compile', ['xsltproc','prettify']);
};
