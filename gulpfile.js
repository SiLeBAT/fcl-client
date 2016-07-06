'use strict';

var gulp = require('gulp'),
    cleancss = require('gulp-clean-css'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    usemin = require('gulp-usemin'),
    rev = require('gulp-rev'),
    del = require('del');

gulp.task('jshint', function() {
    return gulp.src('src/app/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});

gulp.task('clean', function() {
    return del(['dist']);
});

gulp.task('default', ['clean'], function() {
    return gulp.start('usemin', 'iconcopy', 'datacopy');
});

gulp.task('usemin', ['jshint'], function() {
    return gulp.src('src/**/*.html')
        .pipe(usemin({
            css: [cleancss(), rev()],
            js: [rev()]
        }))
        .pipe(gulp.dest('dist/'));
});

gulp.task('iconcopy', function() {
    return gulp.src('src/icons/**/*')
        .pipe(gulp.dest('dist/icons'));
});

gulp.task('datacopy', function() {
    return gulp.src('src/data/**/*')
        .pipe(gulp.dest('dist/data'));
});
