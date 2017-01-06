'use strict';

var gulp = require('gulp'),
    cleancss = require('gulp-clean-css'),
    usemin = require('gulp-usemin'),
    rev = require('gulp-rev'),
    del = require('del');

gulp.task('clean', function() {
    return del(['dist']);
});

gulp.task('default', ['clean'], function() {
    return gulp.start('usemin', 'fontcopy', 'iconcopy', 'datacopy');
});

gulp.task('usemin', function() {
    return gulp.src('src/**/*.html')
        .pipe(usemin({
            css: [cleancss(), rev()],
            js: [rev()]
        }))
        .pipe(gulp.dest('dist/'));
});

gulp.task('fontcopy', function() {
    return gulp.src('src/fonts/**/*')
        .pipe(gulp.dest('dist/fonts'));
});

gulp.task('iconcopy', function() {
    return gulp.src('src/icons/**/*')
        .pipe(gulp.dest('dist/icons'));
});

gulp.task('datacopy', function() {
    return gulp.src('src/data/**/*')
        .pipe(gulp.dest('dist/data'));
});
