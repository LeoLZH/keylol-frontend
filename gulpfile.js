var gulp;
try {
    gulp = require("gulp");
} catch (e) {
    gulp = require("gulp-4.0.build");
}
var template = require("gulp-template");
var _ = require("lodash");
var rename = require("gulp-rename");
var glob = require("glob");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var rev = require("gulp-rev");
var revCollector = require("gulp-rev-collector");
var del = require("del");
var sass = require('gulp-sass');
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require("gulp-autoprefixer");
var minifyInline = require("gulp-minify-inline");
var minifyCss = require("gulp-minify-css");
var templateCache = require("gulp-angular-templatecache");
var fontmin = require('gulp-fontmin');
var ngAnnotate = require('gulp-ng-annotate');
var changed = require('gulp-changed');
var svgSprite = require('gulp-svg-sprite');

// apiEndpoint must have the trailing slash
var buildConfigs = {
    local: {
        bundle: false,
        apiEndpoint: "https://localhost:44300/",
        urlCanonical: false,
        enableStats: false
    },
    dev: {
        bundle: false,
        apiEndpoint: "https://lgbt-api.keylol.com/",
        urlCanonical: false,
        enableStats: true
    },
    lgbt: {
        bundle: true,
        apiEndpoint: "https://lgbt-api.keylol.com/",
        urlCanonical: false,
        enableStats: false
    },
    prod: {
        bundle: true,
        apiEndpoint: "https://api.keylol.com/",
        urlCanonical: false,
        enableStats: true
    }
};

var vendorMinScripts = [
    "node_modules/jquery/dist/jquery.min.js",
    "node_modules/svgxuse/svgxuse.min.js",
    "node_modules/moment/min/moment.min.js",
    "node_modules/moment/locale/zh-cn.js",
    "node_modules/moment-timezone/builds/moment-timezone-with-data.min.js",
    "node_modules/angular/angular.min.js",
    "node_modules/angular-ui-router/release/angular-ui-router.min.js",
    "node_modules/angular-animate/angular-animate.min.js",
    "node_modules/angular-moment/angular-moment.min.js",
    "node_modules/ngstorage/ngStorage.min.js",
    "node_modules/ng-file-upload/dist/ng-file-upload.min.js",
    "node_modules/angular-utf8-base64/angular-utf8-base64.min.js",
    "node_modules/angulartics/dist/angulartics.min.js",
    "node_modules/angulartics-google-analytics/dist/angulartics-ga.min.js",
    "node_modules/angular-applicationinsights/dist/angular-applicationinsights.min.js",
    "node_modules/babel-polyfill/dist/polyfill.min.js",
    "node_modules/ms-signalr-client/jquery.signalR.min.js" // 这个文件一定要放在最后
];

var vendorScripts = [
    "node_modules/angular-i18n/angular-locale_zh.js",
    "node_modules/simple-module/lib/module.js",
    "node_modules/simple-hotkeys/lib/hotkeys.js",
    "node_modules/simple-uploader/lib/uploader.js",
    "node_modules/simditor/lib/simditor.js"
];

var babelScripts = [
    "keylol-app.js",
    "root-controller.js",
    "src/**/*.js"
];

var appScripts = [
    "temporary/keylol-app.js",
    "temporary/environment-config.js",
    "temporary/root-controller.js",
    "temporary/**/*.js"
];

var stylesheets = [
    "assets/stylesheets/normalize.css",
    "node_modules/simditor/styles/simditor.css",
    "temporary/*.css"
];

var sassStylesheets = [
    "assets/scss/predefined/!(fonts.template).scss",
    "assets/scss/!(style).scss",
    "src/**/*.scss"
];

var keylolTextList = "`{}>▾▴其乐推荐据点客务中心讯息轨道评测好资差模组感悟请无视游戏与艺术之间的空隙提交注册申登入发布文章由你筛选变更函会员研谈档邮政服私信蒸汽动力进社区噪音零死角讨论独特鼓励机制志同合琴瑟曲即日内欲知情关联意成功错误认可索取表单开设此阅读搜结果传送装置已就位个人从兴趣始慢搭建一条收到出未能撞到处理这位用户尚或任何当前投稿厂商类型平台剧透警告简完编辑确料定太瞎了获不态了跳过步正在生首页并立案稍候糕块里如也连蛋都没有需验证陆加现解分享放公篇被封存科退通职团队惩教萃撤销录兌換品广场专题器网口令哨所性玩家焦扉报坑仁近畿集数目时驻流派基本渠程原语言华度像界面化硬件对私公函缺失作新脉订友听众安全醒互明细店排行券则系列实密码";

var getFiles = function (arr) {
    return _.union.apply(this, _.map(arr, function (path) {
        return glob.sync(path);
    }));
};

function fontKeylol() {
    return gulp.series(function cleanFontKeylol() {
        return del("assets/fonts/keylol-rail-sung-subset-*");
    }, function generateFontKeylol() {
        return gulp.src("assets/fonts/keylol-rail-sung-full.ttf")
            .pipe(rename("keylol-rail-sung-subset.ttf"))
            .pipe(fontmin({
                text: keylolTextList
            }))
            .pipe(rev())
            .pipe(gulp.dest("assets/fonts"))
            .pipe(rev.manifest("keylol.manifest.json"))
            .pipe(gulp.dest('assets/fonts'));
    });
}

gulp.task("store-font", function () {
    return gulp.src(['assets/fonts/*.json', 'assets/scss/predefined/fonts.template.scss'])
        .pipe(revCollector({
            replaceReved: true
        }))
        .pipe(rename("fonts.scss"))
        .pipe(gulp.dest('assets/scss/predefined/'));
});

gulp.task("font", gulp.series(fontKeylol(), "store-font"));

gulp.task("clean", function () {
    return del(["bundles/!(web.config)", "index.html", "temporary/*"]);
});

gulp.task('build-svg', gulp.series(
    function cleanSVGSprite() {
        return del("assets/images/sprite-*.svg");
    }, function generateSVGSprite() {
        return gulp.src('assets/icons/*.svg')
            .pipe(svgSprite({
                mode: {
                    symbol: {
                        dest: '.',
                        sprite: 'sprite.svg'
                    }
                },
                shape: {
                    id: {separator: '-'},
                    transform: ['svgo']
                }
            }))
            .pipe(rev())
            .pipe(gulp.dest('assets/images'));
    }));

function compileSass(bundle) {
    return gulp.series(function importSass () {
        var stylesheetFiles = getFiles(sassStylesheets);
        return gulp.src("assets/scss/style.scss.ejs")
            .pipe(template({ stylesheets: stylesheetFiles }))
            .pipe(rename("style.scss"))
            .pipe(gulp.dest("assets/scss/"))
    }, function compileFromStyle () {
        var stream = gulp.src("assets/scss/style.scss");
        if(!bundle){
            stream = stream.pipe(sourcemaps.init())
                .pipe(sass().on('error', sass.logError))
                .pipe(sourcemaps.write());
        } else {
            stream = stream.pipe(sass().on('error', sass.logError));
        }
        return stream.pipe(gulp.dest('temporary'));
    });
}
function compileES6(bundle) {
    return function compile () {
        var stream = gulp.src(babelScripts);
        if(!bundle){
            stream = stream.pipe(sourcemaps.init())
                .pipe(changed('temporary'))
                .pipe(babel({
                    presets: ['es2015']
                }))
                .pipe(sourcemaps.write('.'))
        } else {
            stream = stream.pipe(babel({
                presets: ['es2015']
            }));
        }
        return stream.pipe(gulp.dest('temporary'));
    }
}

gulp.task("sass", compileSass());

gulp.task("scss:bundle", compileSass(true));

gulp.task("babel", compileES6());

gulp.task("babel:bundle", compileES6(true));

var getBuildTask = function (configName) {
    var config = buildConfigs[configName];
    return gulp.series("clean", function buildEnvironmentConfig() {
        return gulp.src("environment-config.js.ejs")
            .pipe(template(config))
            .pipe(rename("environment-config.js"))
            .pipe(gulp.dest("temporary/"));
    }, config.bundle ? gulp.parallel("scss:bundle", "babel:bundle") : gulp.parallel("sass", "babel"),
        config.bundle ? gulp.parallel(function concatVendorMinScriptBundle() {
        return gulp.src(vendorMinScripts)
            .pipe(concat("vendor-a.min.js"))
            .pipe(rev())
            .pipe(gulp.dest("bundles"));
    }, function buildVendorScriptsBundle() {
        return gulp.src(vendorScripts)
            .pipe(concat("vendor-b.min.js"))
            .pipe(uglify())
            .pipe(rev())
            .pipe(gulp.dest("bundles"));
    }, function buildAppScriptBundle() {
        return gulp.src(appScripts)
            .pipe(concat("app.min.js"))
            .pipe(ngAnnotate())
            .pipe(uglify())
            .pipe(rev())
            .pipe(gulp.dest("bundles"));
    }, function buildTemplateBundle() {
        return gulp.src("src/**/*.html")
            .pipe(minifyInline({
                css: {
                    keepSpecialComments: 0
                }
            }))
            .pipe(templateCache("templates.min.js", {
                root: "src/",
                module: "KeylolApp"
            }))
            .pipe(uglify())
            .pipe(rev())
            .pipe(gulp.dest("bundles"));
    }, function buildStylesheetBundle() {
        return gulp.src(stylesheets)
            .pipe(autoprefixer())
            .pipe(minifyCss({
                keepSpecialComments: 0,
                relativeTo: "bundles",
                target: "bundles"
            }))
            .pipe(concat("stylesheets.min.css"))
            .pipe(rev())
            .pipe(gulp.dest("bundles"));
    }) : function skipBundles(done) {
        done();
    }, function buildEntryPage() {
        var scriptFiles, stylesheetFiles;
        if (config.bundle) {
            scriptFiles = getFiles(["bundles/vendor-*.min.js", "bundles/app-*.min.js", "bundles/templates-*.min.js"]);
            stylesheetFiles = getFiles(["bundles/stylesheets-*.min.css"]);
        } else {
            scriptFiles = getFiles(vendorMinScripts.concat(vendorScripts).concat(appScripts));
            stylesheetFiles = getFiles(stylesheets);
        }
        var stream = gulp.src("index.html.ejs")
            .pipe(template({
                scripts: scriptFiles,
                stylesheets: stylesheetFiles,
                urlCanonical: config.urlCanonical,
                enableStats: config.enableStats
            }))
            .pipe(rename("index.html"));
        if (config.bundle) {
            stream = stream.pipe(minifyInline({
                    css: {
                        keepSpecialComments: 0
                    }
                }));
        }
        return stream.pipe(gulp.dest("./"));
    });
};

gulp.task("prod", getBuildTask("prod"));

gulp.task("dev", getBuildTask("dev"));

gulp.task("lgbt", getBuildTask("lgbt"));

gulp.task("local", getBuildTask("local"));

gulp.task("default", getBuildTask("dev"));

gulp.task("dev:watch", gulp.series("dev", function watch () {
    gulp.watch(sassStylesheets, compileSass());
    gulp.watch(babelScripts, compileES6());
}));
