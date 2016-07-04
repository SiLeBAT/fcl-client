'use strict';

var gulp = require('gulp'),
    cleancss = require('gulp-clean-css'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    usemin = require('gulp-usemin'),
    imagemin = require('gulp-imagemin'),
    rev = require('gulp-rev'),
    del = require('del');

gulp.task('jshint', function() {
    return gulp.src('app/scripts/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});

gulp.task('clean', function() {
    return del(['dist']);
});

gulp.task('default', ['clean'], function() {
    return gulp.start('usemin', 'imagemin', 'iconcopy', 'datacopy');
});

gulp.task('usemin', ['jshint'], function() {
    return gulp.src('./app/**/*.html')
        .pipe(usemin({
            css: [cleancss(), rev()],
            js: [rev()]
        }))
        .pipe(gulp.dest('dist/'));
});

gulp.task('imagemin', function() {
    return gulp.src('app/images/**/*')
        .pipe(imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        }))
        .pipe(gulp.dest('dist/images'));
});

gulp.task('iconcopy', function() {
    return gulp.src('app/icons/**/*')
        .pipe(gulp.dest('dist/icons'));
});

gulp.task('datacopy', function() {
    return gulp.src('app/data/**/*')
        .pipe(gulp.dest('dist/data'));
});
