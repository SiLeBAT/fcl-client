'use strict';

var gulp = require('gulp'),
    cleancss = require('gulp-clean-css'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    uglify = require('gulp-uglify'),
    usemin = require('gulp-usemin'),
    imagemin = require('gulp-imagemin'),
    rev = require('gulp-rev'),
    del = require('del'),
    ngannotate = require('gulp-ng-annotate');

gulp.task('jshint', function () {
    return gulp.src('app/scripts/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});

// Clean
gulp.task('clean', function () {
    return del(['dist']);
});

// Default task
gulp.task('default', ['clean'], function () {
    return gulp.start('usemin', 'imagemin', 'copyfonts');
});

gulp.task('usemin', ['jshint'], function () {
    return gulp.src('./app/**/*.html')
        .pipe(usemin({
            css: [cleancss(), rev()],            
            js: [ngannotate(), uglify(), rev()]
        }))
        .pipe(gulp.dest('dist/'));
});

// Images
gulp.task('imagemin', function () {
    return gulp.src('app/images/**/*')
        .pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
        .pipe(gulp.dest('dist/images'));
});

gulp.task('copyfonts', ['clean'], function () {
    return gulp.src([
        './bower_components/font-awesome/fonts/**/*.{ttf,woff,eof,svg}*',
        './bower_components/bootstrap/dist/fonts/**/*.{ttf,woff,eof,svg}*'
    ]).pipe(gulp.dest('./dist/fonts'));    
});
