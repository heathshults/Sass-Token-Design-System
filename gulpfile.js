const gulp = require('gulp')
const sass = require('gulp-sass')
// const browserSync = require('browser-sync').create()
const browserSync = require('browser-sync')
const header = require('gulp-header')
const cleanCSS = require('gulp-clean-css')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify')
const postcss = require('gulp-postcss')
const sourcemaps = require('gulp-sourcemaps')
const autoprefixer = require('autoprefixer')
const pkg = require('./package.json')
const stylefmt = require('gulp-stylefmt')
const clean = require('gulp-clean')
const sorting = require('postcss-sorting')

const bases = {
  app: 'src',
  dist: 'dist'
}

const paths = {
  js: [
    'js/**/*.js',
    '!scripts/libs/**/*.js'
  ],
  packages: [
    'packages/**/*.js',
    'packages/**/*.css'
  ],
  styles: [
    'css/**/*.css',
    'css/images/**/*.jpg',
    'css/images/**/*.png',
    'css/images/**/*.svg',
    'css/images/**/*.gif',
    'css/vendor/**',
    'css/web-fonts/**'
  ],
  html: ['*.html'],
  images: ['images/**/*.png', 'images/**/*.jpg', 'images/**/*.svg', 'images/**/*gif'],
  extras: ['crossdomain.xml', 'humans.txt', 'robots.txt', 'favicon.ico']
}

// watch files for changes and reload
gulp.task('serve', () => {
  const reload = browserSync.reload

  browserSync({
    server: {
      baseDir: bases.app
    }
  })

  gulp.watch(['*.html', `${bases.app}/css/**/*.css`, `${bases.app}/js/**/*.js`], {
    cwd: bases.app
  }, reload)
})

gulp.task('stylefmt',  () => gulp.src(`${bases.app}/scss/hes.scss`)
  .pipe(stylefmt())
  .pipe(gulp.dest('./test')))

gulp.task('sort-props', () => gulp.src(`${bases.app}/scss/hes.scss`).pipe(
  postcss([
    sorting({
      parser: 'sugarss',
      syntax: 'postcss-scss',
      map: 'inline',
      from: './src/css/hes.css',
      to: './dist/hes.css'
    })
  ])
).pipe(gulp.dest('./test')))

// Set the banner content
const banner = ['/*!\n',
  ' * Start USAFB - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
  ` * Copyright 2017-${(new Date()).getFullYear()}`, ' <%= pkg.author %>\n',
  ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n',
  ' */\n',
  ''
].join('')

// Delete the dist directory
gulp.task('clean', () => {
  gulp.src(bases.dist)
    .pipe(clean())
})
// Process scripts and concatenate them into one output file
gulp.task('scripts', ['clean'], () => {
  gulp.src(paths.js, {
    cwd: bases.app
  })
    // .pipe(jshint())
    // .pipe(jshint.reporter('default'))
    .pipe(uglify())
    .pipe(concat('app.min.js'))
    .pipe(gulp.dest(`${bases.dist}/js/`))
})

// Copy all other files to dist directly
gulp.task('copy', ['clean'], () => {
  // Copy html
  gulp.src(paths.html, {
    cwd: bases.app
  })
    .pipe(gulp.dest(bases.dist))

  // Copy styles
  gulp.src(paths.css, {
    cwd: bases.app
  })
    .pipe(gulp.dest(`${bases.dist}/css`))

  // Copy lib scripts, maintaining the original directory structure
  gulp.src(paths.packages, {
    cwd: bases.app
  })
    .pipe(gulp.dest(bases.dist))

  // Copy extra html5bp files
  gulp.src(paths.extras, {
    cwd: bases.app
  })
    .pipe(gulp.dest(bases.dist))

  // in test mode, needs correct directory sset for real use
  // gulp.task('stylefmt',  () => {
  //   return gulp.src(`${bases.app}/scss/hes.scss`)
  //     .pipe(stylefmt())
  //     .pipe(gulp.dest('./test'));
  // });


  // gulp.task('stylefmt', () => {
  //   gulp.src(`${bases.app}/scss/hes.scss`)
  //   .pipe(stylefmt())
  //   .pipe(gulp.dest('./test'))
  // gulp.src([
  //   'node_modules/font-awesome/css/**',
  //   '!node_modules/font-awesome/**/*.map',
  //   '!node_modules/font-awesome/.npmignore',
  //   '!node_modules/font-awesome/*.txt',
  //   '!node_modules/font-awesome/*.md',
  //   '!node_modules/font-awesome/*.json'
  // ])
    // .pipe(gulp.dest(`${bases.dist}/css/vendor/font-awesome`))
  // })
})

// autoprefix vendor browsers where necessary
gulp.task('autoprefixme', () => {
  gulp.src(`${bases.app}/css/*.css`)
    .pipe(sourcemaps.init())
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemaps.write('.'))
    .pipe(rename({
      prefix: ''
    }))
    .pipe(gulp.dest(`${bases.app}/css/test`))
})

// Run everything
gulp.task('default', ['clean', 'copy'])
// Configure the browserSync task
gulp.task('browserSync', () => {
  browserSync.init({
    server: {
      baseDir: bases.app
    }
  })
})

// Compiles SCSS files from /scss into /css
gulp.task('sass', () => {
  gulp.src(`${bases.app}/scss/**/*.scss`)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(`${bases.app}/css`))
})

// watch task
gulp.task('sass:watch',  () => {
  gulp.watch(`${bases.app}/scss/**/*.scss`, ['sass'])
})

// Minify compiled CSS
gulp.task('minify-css', ['sass'], () => gulp.src(`${bases.app}/css/*.css`)
  .pipe(cleanCSS({
    compatibility: 'ie8'
  }))
  .pipe(rename({
    // prefix: 'usafb-',
    suffix: '.min'
  }))
  .pipe(gulp.dest(`${bases.dist}/css/`))
  .pipe(browserSync.reload({
    stream: true
  })))

// Minify JS
gulp.task('minify-js', () => gulp.src(`${bases.dist}/js/*.js`)
  .pipe(uglify())
  .pipe(header(banner, {
    pkg
  }))
  .pipe(rename({
    prefix: 'hes-',
    suffix: '.min'
  }))
  .pipe(gulp.dest(`${bases.dist}/css/`))
  .pipe(browserSync.reload({
    stream: true
  })))

// Build CSS & JS files with browserSync
gulp.task('watch-all', ['browserSync', 'sass', 'autoprefixme', 'minify-css', 'minify-js'], () => {
  gulp.watch(`${bases.app}/scss/*.scss`, ['sass'])
  gulp.watch(`${bases.app}/css/*.css`, ['autoprefixme'], ['minify-css'])
  gulp.watch(`${bases.app}/js/*.js`, ['minify-js'])
  // Reloads the browser whenever HTML, CSS or JS files change
  gulp.watch('*.html', browserSync.reload)
  gulp.watch('*.css', browserSync.reload)
  gulp.watch(`${bases.app}/js/**/*.js`, browserSync.reload)
})
