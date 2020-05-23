var fs=require('file-system');
var webTargetDir = './';
var versionDir = '';
var activityDir='';
var dirs = fs.readdirSync('./activity');
var babel = require("gulp-babel");
for (var i=0;i<dirs.length;i++)
{
    if(dirs[i].toString().indexOf(".")==0){
        continue;
    }
    activityDir=dirs[i];
}

var tempSrc = 'activity/'+activityDir+"/";
var tempjs = tempSrc +'js/';
var tempcss = tempSrc +'css/';
var temphtml = tempSrc +'html/';
var tempImg = tempSrc+'img/';

var IS_MIN = false;

var imgMiniTask = [];
var imgUrlTask = [];
var fistGulpTask=[];
var modifySourceUrlTask=[];

var gulp = require('gulp');
var rev = require('gulp-rev');
var minifycss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var revCollector = require('gulp-rev-collector');

var festCssCfg = {};
var festImgCfg = {};
var festCfg={merge:true};

var versionCssDir = versionDir+'css/';  //在HTML中的CSS URL
var versionJsDir = versionDir+'js/';    //在HTML中的JS URL
var versionImgDir = versionDir+'img/';    //在HTML中的JS URL
var versionHtmlDir = versionDir+'html/';    //在HTML中的JS URL

function funcFormatDate(date){
    return date<10?'0'+date:date;
}

function deleteall(path) {
    var files = [];
    if(fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function(file, index) {
            var curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()) { // recurse
                deleteall(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

//打包目录
function createGulpDir(){
    var date = new Date();
    versionDir = 'activity'+date.getFullYear()+funcFormatDate(date.getMonth()+1)+funcFormatDate(date.getDate())+'/';
    versionDir = webTargetDir+versionDir+tempSrc;
    //判断当前文件夹是否存在，如果存在就删除
    if(fs.existsSync(versionDir))
    {
        deleteall(versionDir);
    }
    versionCssDir = versionDir+'css/';  //在HTML中的CSS URL
    versionJsDir = versionDir+'js/';    //在HTML中的JS URL
    versionImgDir = versionDir+'img/';    //在HTML中的JS URL
    versionHtmlDir = versionDir+'html/';    //在HTML中的JS URL
    console.log("createGulpDir");
}

function delRevJsonFile(path)
{
    fs.unlinkSync(path+"css/rev-manifest.json");
    fs.unlinkSync(path+"img/rev-manifest.json");
    fs.unlinkSync(path+"js/rev-manifest.json");
}

function funcMiniCss( taskName){
    gulp.task(taskName,gulp.series( function(){
        return gulp.src([tempcss+'/*.css', tempcss+'/*/*.css'])
            .pipe(minifycss({compatibility: 'ie8',advanced:false,aggressiveMerging:false}))
            .pipe(rev())
            .pipe(gulp.dest(versionCssDir))
            .pipe(rev.manifest(festCssCfg))
            .pipe(gulp.dest(versionCssDir));
    }));
}
function funcMiniJs(taskName){
    gulp.task(taskName, gulp.series(function() {
        return gulp.src(tempjs+'/*.js').pipe(babel({presets: ['es2015']})).pipe(uglify()).pipe(rev()).pipe(gulp.dest(versionJsDir)).pipe(rev.manifest(festCfg)).pipe(gulp.dest(versionJsDir));
    }));
}

//修改资源文件的引用
function modifySourceUrl(taskName) {
    var manifestSrc = [versionCssDir+'*manifest.json', versionJsDir+'*manifest.json'];//,festCssPath+'rev-manifest.json','*manifest.json'
    console.log("manifestName:"+taskName.toString());
    var dirReplace = {
        'css/': versionHtmlDir+'css/',
        'js/': versionHtmlDir+'js/'
    };
    gulp.task(taskName, gulp.series(function () {
        var manifestName = manifestSrc.concat();
        manifestName.push(temphtml+'*.html');
        return gulp.src(manifestName)
            .pipe(revCollector({
                replaceReved: true,
                // dirReplacements: dirReplace
            }))
            //.pipe(minifyHtml({conditionals: true, loose: true}))
            .pipe(gulp.dest(versionHtmlDir));
        //gulp.task('del', require('del')('rev'));//最后删除过渡文件目录
    }));
}


/**
 * images files rename with hash code
 * @param taskName
 * @param depTask
 */
function funcMiniImages(taskName){
    gulp.task(taskName,gulp.series( function() {
        var imgFiles = [tempImg+'*.png', tempImg+'*.jpg',tempImg+'*.gif', tempImg+'**/*.png', tempImg+'**/*.jpg',
            tempImg+'**/*.gif',tempImg+'**/**/*.png', tempImg+'**/**/*.jpg',tempImg+'**/**/*.gif'];
        return gulp.src(imgFiles)
            .pipe(rev()).pipe(gulp.dest(versionImgDir)).pipe(rev.manifest(festImgCfg)).pipe(gulp.dest(versionImgDir));
    }));
}
function funcImgUrlCss(taskName){
    var manifestSrc = [versionImgDir+'*manifest.json'];//,festCssPath+'rev-manifest.json','*manifest.json'
    console.log("manifestName: funcImgUrlCss");
    var imgUrl = "/"+tempSrc+'img/';
    var dirReplace = {
        '../../../../img/': imgUrl,
        '../../../img/': imgUrl,
        '../../img/': imgUrl,
        '../img/': imgUrl,
        '/sresource/img/': imgUrl,
        'sresource/img/': imgUrl
    };
    gulp.task(taskName, gulp.series(function () {
        var manifestName = manifestSrc.concat();
        var cssFiles = [tempcss+'*.css', tempcss+'**/*.css', tempcss+'**/**/*.css'];
        manifestName = manifestName.concat(cssFiles);
        return gulp.src(manifestName)
            .pipe(revCollector({
                replaceReved: true,
                dirReplacements: false
            }))
            .pipe(gulp.dest(tempcss));
    }));
}
function funcImgUrlHtml(taskName){
    var manifestSrc = [versionImgDir+'*manifest.json'];//,festCssPath+'rev-manifest.json','*manifest.json'
    console.log("manifestName: funcImgUrlHtml");
    var imgUrl = "/"+tempSrc+'img/';
    var dirReplace = {
        '../../../../img/': imgUrl,
        '../../../img/': imgUrl,
        '../../img/': imgUrl,
        '../img/': imgUrl,
        '/sresource/img/': imgUrl,
        'sresource/img/': imgUrl
    };
    gulp.task(taskName,gulp.series( function () {
        var manifestName = manifestSrc.concat();
        manifestName.push(temphtml+'*.html');manifestName.push(temphtml+'**/*.html');
        return gulp.src(manifestName)
            .pipe(revCollector({
                replaceReved: true,
                dirReplacements: false
            }))
            //.pipe(minifyHtml({conditionals: true, loose: true}))
            .pipe(gulp.dest(temphtml));
    }));
}
function funcImgUrlJs(taskName){
    var manifestSrc = [versionImgDir+'*manifest.json'];//,festCssPath+'rev-manifest.json','*manifest.json'
    console.log("manifestName: funcImgUrlJs");
    var imgUrl = "/"+tempSrc+'img/';
    var dirReplace = {
        '../../../../img/': imgUrl,
        '../../../img/': imgUrl,
        '../../img/': imgUrl,
        '../img/': imgUrl,
        '/sresource/img/': imgUrl,
        'sresource/img/': imgUrl
    };
    gulp.task(taskName, gulp.series(function () {
        var manifestName = manifestSrc.concat();
        manifestName.push(tempSrc+'js/*.js');
        manifestName.push(tempSrc+'js/**/*.js');
        return gulp.src(manifestName)
            .pipe(revCollector({
                replaceReved: true,
                dirReplacements: false
            }))
            //.pipe(minifyHtml({conditionals: true, loose: true}))
            .pipe(gulp.dest(tempSrc+'js/'));
    }));
}

function main(){
    createGulpDir();
    var miniImage = "miniImage";
    var imgUrlCss="imgUrlCss";
    var imgUrlJs="imgUrlJs";
    var imgUrlHtml="imgUrlHtml";
    var miniCss = "miniCss";
    var miniJs="miniJs";
    var sourceUrlTask= "sourceUrlTask";
    funcMiniImages(miniImage);
    funcImgUrlCss(imgUrlCss);
    funcImgUrlJs(imgUrlJs);
    funcImgUrlHtml(imgUrlHtml);
    funcMiniCss(miniCss);
    funcMiniJs(miniJs);
    modifySourceUrl(sourceUrlTask);

    gulp.task('default',gulp.series(miniImage,imgUrlCss,imgUrlJs,imgUrlHtml,miniCss,miniJs,sourceUrlTask,done => {
        done();
    }));

}
main();