/**************************
 **    Import modules    **
 **************************/

let glob = require('glob');
let mix = require('laravel-mix');
let webpack = require('webpack');
let tailwindcss = require('tailwindcss');

require('laravel-mix-purgecss');

let webpackShellPlugin = require('webpack-shell-plugin');
let webpackAliases = {markjs: 'mark.js/dist/jquery.mark.js'};
let Dependencies = require('laravel-mix/src/Dependencies.js');
let postCssPlugins = [
    tailwindcss('./tailwind.config.js'),
    require('postcss-nested'),
];


/**************************
 ** Initialize Variables **
 **************************/

// Modules to skip compiling
let dontDiscover = [];

// npm dependencies to be installed
let moduleDependencies = [];

// Extracted vendor libraries
let vendorLibraries = [
    //jQuery
    'jquery',

    'vue',
    'axios',
    'lodash',
    'mark.js',
    'tinymce',
    'pusher-js',
    'turbolinks',
    'laravel-echo',
    'intl-tel-input',
    'vue-template-compiler',

    // Mouse interaction
    'jquery-mousewheel',
    'jquery-slimscroll',

    // Bootstrap
    'bootstrap-sass',
    'bootstrap-notify',

    // Pickers
    'timepicker',
    'datepair.js',
    'bootstrap-datepicker',
    'bootstrap-colorpicker',
    'fontawesome-iconpicker',
    'bootstrap-daterangepicker',
    'datepair.js/src/jquery.datepair',

    // Misc
    'moment',
    'select2',
    'dropzone',

    // Theme
    'admin-lte',
];


let scanForCssSelectors = [
    path.join(__dirname, 'app/**/*.php'),
    path.join(__dirname, 'config/*.php'),
    path.join(__dirname, 'resources/js/**/*.js'),
    path.join(__dirname, 'resources/views/**/*.php'),
    path.join(__dirname, 'node_modules/select2/**/*.js'),
    path.join(__dirname, 'node_modules/dropzone/**/*.js'),
    path.join(__dirname, 'node_modules/admin-lte/dist/**/*.js'),
    path.join(__dirname, 'node_modules/datatables.net/**/*.js'),
    path.join(__dirname, 'node_modules/bootstrap-notify/**/*.js'),
    path.join(__dirname, 'node_modules/fontawesome-iconpicker/dist/**/*.js'),
];

let whitelistPatterns = [/select2/, /alert/, /turbolinks/, /iti/, /dt-/, /dataTable/, /col-/, /btn-/];

let webpackPlugins = [
    // Reduce bundle size by ignoring moment js local files
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

    // Add shell command plugin to execute shell commands on building
    new webpackShellPlugin({
        onBuildStart: ['php artisan laroute:generate --ansi --no-interaction', 'php artisan lang:js --ansi --no-lib --no-interaction'],
        onBuildEnd: [],
    }),
];

let purgeCssOptions = {
    enabled: true,
    globs: scanForCssSelectors,
    extensions: ['html', 'js', 'php', 'vue'],
    whitelistPatternsChildren: whitelistPatterns,
};


/**************************
 **   Dynamic modules    **
 **************************/

glob.sync('app/*/*/resources/js/webpack.mix.js').forEach(function (file) {
    let moduleName = file.split('/')[1] + '/' + file.split('/')[2];

    // Check if we need to skip this module
    if (dontDiscover.includes(moduleName)) {
        return;
    }

    let moduleWebpack = require(path.join(__dirname, file));

    moduleDependencies.push(...moduleWebpack.install || []);
    scanForCssSelectors.push(...moduleWebpack.scanForCssSelectors || []);
    whitelistPatterns.push(...moduleWebpack.whitelistPatterns || []);
    webpackPlugins.push(...moduleWebpack.webpackPlugins || []);

    moduleWebpack.mix.js.forEach(function(dependency) {
        mix.js(dependency.input, dependency.output);
    });

    moduleWebpack.mix.css.forEach(function(dependency) {
        mix.sass(dependency.input, dependency.output);
    });

    moduleWebpack.copy.forEach(function(path) {
        mix.copyDirectory(path.from, path.to);
    });
});

// Install module dependencies
new Dependencies(moduleDependencies).install(false);


/**************************
 ** Mix Asset Management **
 **************************/

mix

    .options({
        processCssUrls: false,
        postCss: postCssPlugins,
    })

    .webpackConfig({
        plugins: webpackPlugins,
        resolve: {alias: webpackAliases},
    })

    .sass('resources/sass/app.scss', 'public/css/app.css')
    .sass('resources/sass/vendor.scss', 'public/css/vendor.css')
    .sass('resources/sass/datatables.scss', 'public/css/datatables.css')

    .js('resources/js/vendor/datatables.js', 'public/js/datatables.js')
    .js('resources/js/app.js', 'public/js/app.js')

    .extract(vendorLibraries, 'public/js/vendor.js')
    .purgeCss(purgeCssOptions)
    .version();
