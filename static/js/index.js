// 相机品牌logo文件名
const LOGO_FILENAMES = ["nikon", "nikon_full", "canon", "sony", "fujifilm", "hasselblad", "hasselblad-t", "leica", "leica_full",
    "leica_red_full", "red", "red_full", "dji", "install360", "kodak", "lumix", "mamiya", "olympus", "panasonic",
    "pentax", "phaseOne", "ricoh", "rolleiflex", "sigma", "tamron", "zeiss_full"];
const MAX_RADIUS = 500;
const MAX_BLUR = 200;
const MAX_SHADOW = 500;
const MAX_FONT_SIZE = 500;

// 页面元素选择
const rightBlockDiv = document.getElementById('rightBlockDiv');
const importImgInput = document.getElementById('importImgInput');
const importImgBtn = document.getElementById('importImgBtn');
const selectLogoBtn = document.getElementById('selectLogoBtn');
const exportImgBtn = document.getElementById('exportImgBtn');
const imgViewImg = document.getElementById('imgViewImg');
const logoViewImg = document.getElementById('logoViewImg');
const modelInput = document.getElementById('modelInput');
const exifInput = document.getElementById('exifInput');
const canvasTemp = document.getElementById('canvasTemp');
const ctxTemp = canvasTemp.getContext('2d', { willReadFrequently: true });

// 自定义变量
const LOGO_URL_PREFIX = "./static/imgs/logo/";
const imgConfig = {
    konva: {
        stage: null,
        layer: null,
        containerWidth: 0,
        containerHeight: 0,
        fullWidth: 0,
        fullHeight: 0,
    },
    img: null,
    imgLoad: null,
    logoImg: null,
    logoImgUrl: null,
    logoImgLoad: null,
    modelText: "Z30",
    exifText: null,
    blur: 150,
    radius: 40,
    shadow: 100,
    fontSize: 50,
    fontColor: '#000000',
    font: 'DingTalkSans'
};
let logoSelectorHtml = "";
// 相机图标选择器layer弹窗索引
let logoSelectorIndex = null;

init();
function init(){
    // layui初始化
    // 渲染 - 滑块
    layui.slider.render({
        elem: '#fontSlider', value: 25, theme: '#1548e6',
        done: function(value){
            let newValue = value / 100 * MAX_FONT_SIZE;
            if(imgConfig.fontSize !== newValue){
                imgConfig.fontSize = newValue;
                update();
            }
        }
    });
    layui.slider.render({
        elem: '#radiusSlider', value: 8, theme: '#1548e6',
        done: function(value){
            let newValue = value / 100 * MAX_RADIUS;
            if(imgConfig.radius !== newValue){
                imgConfig.radius = newValue;
                update();
            }
        }
    });
    layui.slider.render({
        elem: '#shadowSlider', value: 20, theme: '#1548e6',
        done: function(value){
            let newValue = value / 100 * MAX_SHADOW;
            if(imgConfig.shadow !== newValue){
                imgConfig.shadow = newValue;
                update();
            }
        }
    });
    layui.slider.render({
        elem: '#blurSlider', value: 75, theme: '#1548e6',
        done: function(value){
            let newValue = value / 100 * MAX_BLUR;
            if(imgConfig.blur !== newValue){
                imgConfig.blur = newValue;
                update();
            }
        }
    });
    // 渲染 - 颜色选择器
    layui.colorpicker.render({
        elem: '#fontColorPicker', color: '#000000',
        done: function(value){
            if(imgConfig.fontColor !== value){
                imgConfig.fontColor = value;
                update();
            }
        }
    });
    // 渲染 - 图片轮播
    layui.carousel.render({
        elem: '#imgViewDiv', width: '100%', height: '160px', autoplay: false, indicator: 'outside',
    });
    layui.form.on('select(fontSelect)', function(data){
        if(imgConfig.font !== data.value){
            imgConfig.font = data.value;
            update();
        }
    });

    // 绑定事件
    importImgBtn.onclick = importImg;
    selectLogoBtn.onclick = openLogoSelector;
    importImgInput.onchange = importImgInputFileChange;
    exportImgBtn.onclick = exportImg;
    modelInput.onkeydown = function (event) {
        if (event.key === 'Enter' || event.keyCode === 13) {
            event.preventDefault();
            let modelText = modelInput.value;
            if(imgConfig.modelText !== modelText){
                imgConfig.modelText = modelText;
                update();
            }
        }
    };
    exifInput.onkeydown = function (event) {
        if (event.key === 'Enter' || event.keyCode === 13) {
            event.preventDefault();
            let exifText = exifInput.value;
            if(imgConfig.exifText !== exifText){
                imgConfig.exifText = exifText;
                update();
            }
        }
    };

    // 初始化logo选择内容
    for (let filename of LOGO_FILENAMES) {
        // TODO 应当在第一个位置填充一个空白图标，用于清空图标选择
        let url = LOGO_URL_PREFIX + filename + '.png';
        logoSelectorHtml += '<div class="logo-item" onclick="logoSelected(\'' + url + '\')"><img src="' + url + '" alt="' + filename + '"></div>'
    }

    const konvaContainerBlock = document.getElementById('konvaContainerBlock').getBoundingClientRect();
    imgConfig.konva.containerWidth = konvaContainerBlock.width;
    imgConfig.konva.containerHeight = konvaContainerBlock.height;
    imgConfig.konva.stage = new Konva.Stage({
        container: 'konvaContainer',
        width: imgConfig.konva.containerWidth,
        height: imgConfig.konva.containerHeight,
    });
    imgConfig.konva.layer = new Konva.Layer();
    imgConfig.konva.stage.add(imgConfig.konva.layer);

    // 显示默认图片
    imgSelected("./static/imgs/index.jpg");
}

/**
 * 导入图片
 */
function importImg(){
    importImgInput.click();
}
function importImgInputFileChange(event){
    const file = event.target.files[0];
    // 确保用户选择了文件
    if (file) {
        const reader = new FileReader();
        // 当文件读取完成时，更新图片源
        reader.onload = function(e) {
            imgSelected(e.target.result);
        };
        // 读取文件内容
        reader.readAsDataURL(file);
    }
}

function imgSelected(url){
    imgViewImg.src = url;
    let img = new Image();
    img.src = url;
    imgConfig.img = img;
    imgConfig.imgLoad = new Promise((resolve, reject) => {
        img.onload = () => {
            imgConfig.imgLoad = null;
            // 获取图片拓展信息
            EXIF.getData(img, function() {
                const FNumber = EXIF.getTag(this, 'FNumber');
                const ExposureTime = EXIF.getTag(this, 'ExposureTime');
                const ISOSpeedRatings = EXIF.getTag(this, 'ISOSpeedRatings');
                const FocalLength = EXIF.getTag(this, 'FocalLength');
                console.log(FNumber, ExposureTime, ISOSpeedRatings, FocalLength);
                imgConfig.exifText = "";
                if(FocalLength){
                    imgConfig.exifText += FocalLength + "mm ";
                }
                if(FNumber){
                    imgConfig.exifText += "f/" + FNumber + " ";
                }
                if(ExposureTime){
                    imgConfig.exifText += ExposureTime.numerator + "/" + ExposureTime.denominator + " ";
                }
                if(ISOSpeedRatings){
                    imgConfig.exifText += "ISO" + ISOSpeedRatings;
                }
                if(!exifInput.value && imgConfig.exifText){
                    exifInput.value = imgConfig.exifText;
                }
                resolve();
            });
        };
        img.onerror = () => {
            imgConfig.img = null;
            imgConfig.imgLoad = null;
            reject(new Error('Image failed to load'));
        };
    });
    update();
}

/**
 * 打开图标选择器
 */
function openLogoSelector() {
    // 获取元素的边界矩形信息
    const rect = rightBlockDiv.getBoundingClientRect();
    // 计算元素中心点在可视区域中的位置
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    logoSelectorIndex = layer.open({
        type: 1,
        area: ['280px', '400px'],
        offset: [(centerY - 400/2)+'px', (centerX - 280/2) + 'px'],
        shadeClose: true,
        title: "请选择LOGO",
        skin: 'layer-logo-selector',
        content: '<div class="logo-selector"><div class="logo-grid">' + logoSelectorHtml + '</div></div>',
    });
}

/**
 * 图标选择器选中
 * @param url 选择的图标路径
 */
function logoSelected(url){
    // 关闭图标选择器弹层
    if(logoSelectorIndex) layer.close(logoSelectorIndex);
    logoViewImg.src = url;
    let logoImg = new Image();
    logoImg.src = url;
    imgConfig.logoImg = logoImg;
    imgConfig.logoImgUrl = url;
    imgConfig.logoImgLoad = new Promise((resolve, reject) => {
        logoImg.onload = () => {
            imgConfig.logoImgLoad = null;
            resolve();
        };
        logoImg.onerror = () => {
            imgConfig.logoImg = null;
            imgConfig.logoImgUrl = null;
            imgConfig.logoImgLoad = null;
            reject(new Error('Image failed to load'));
        };
    });
    update();
}

/**
 * 获取设置内容
 */
function getSetting(){
    let modelText = modelInput.value;
    let exifText = exifInput.value;
    if(modelText){
        imgConfig.modelText = modelText;
    }
    if(exifText){
        imgConfig.exifText = exifText;
    }
}

/**
 * 核心渲染方法
 */
async function update(){
    console.log("begin")
    let loadIndex = layer.load(2);
    try {
        if(!imgConfig.img){
           return;
        }
        if(imgConfig.imgLoad){
            await imgConfig.imgLoad;
        }
        if(imgConfig.logoImgLoad){
            await imgConfig.logoImgLoad;
        }
        console.log('Images loaded!');
        getSetting();
        let img = imgConfig.img;
        let logoImg = imgConfig.logoImg;
        let modelText = imgConfig.modelText;
        let exifText = imgConfig.exifText;
        let blur = formatNumberValue(imgConfig.blur, 0, MAX_BLUR, 150);
        let radius = formatNumberValue(imgConfig.radius, 0, MAX_RADIUS, 40);
        let shadow = formatNumberValue(imgConfig.shadow, 0, MAX_SHADOW, 100);
        let fontSize = formatNumberValue(imgConfig.fontSize, 20, MAX_FONT_SIZE, 50);
        let fontColor = formatValue(imgConfig.fontColor, "#000000");
        let font = formatValue(imgConfig.font, "DingTalkSans");
        // konva操作对象
        const konvaStage = imgConfig.konva.stage;
        const konvaLayer = imgConfig.konva.layer;

        // 获取原图尺寸
        let width = img.width;
        let height = img.height;
        imgConfig.konva.fullWidth = width;
        imgConfig.konva.fullHeight = height;

        // 如果图片尺寸超过容器，等比例缩小
        let stageScale = 1;
        if (width > imgConfig.konva.containerWidth * 0.9 || height > imgConfig.konva.containerHeight * 0.9) {
            const scaleW = imgConfig.konva.containerWidth / width * 0.9;
            const scaleH = imgConfig.konva.containerHeight / height * 0.9;
            stageScale = Math.min(scaleW, scaleH);
        }
        konvaStage.scaleX(stageScale);
        konvaStage.scaleY(stageScale);
        konvaStage.x((imgConfig.konva.containerWidth - width*stageScale)/2);
        konvaStage.y((imgConfig.konva.containerHeight - height*stageScale)/2);

        // 绘制背景图片
        if(!imgConfig.konva.bgImg){
            const bgImg = new Konva.Image({
                image: img,
                width: width,
                height: height,
                blurRadius: blur,
            });
            // 进行模糊处理
            bgImg.cache();
            bgImg.filters([Konva.Filters.Blur]);
            konvaLayer.add(bgImg);
            imgConfig.konva.bgImg = bgImg;
        }else{
            if(imgConfig.konva.bgImg.blurRadius() !== blur){
                imgConfig.konva.bgImg.blurRadius(blur);
            }
            if(imgConfig.konva.bgImg.image() !== img){
                imgConfig.konva.bgImg.setAttrs({
                    image: img,
                    width: width,
                    height: height,
                });
                // 进行模糊处理
                imgConfig.konva.bgImg.cache();
                imgConfig.konva.bgImg.filters([Konva.Filters.Blur]);
            }
        }
        console.log('1!');

        // 计算前景图片位置和大小
        let fgWidth = width * 0.8;
        let fgHeight = height * 0.8;
        let fgX = (width - fgWidth) / 2;
        let fgY = (height - fgHeight) * 0.25;
        if(!imgConfig.konva.fgImg){
            // 绘制前景图片
            const fgImg = new Konva.Image({
                image: img,
                width: fgWidth,
                height: fgHeight,
                x: fgX,
                y: fgY,
                // 绘制圆角
                cornerRadius: radius,
                // 绘制前景图片阴影
                shadowColor: "#000",
                shadowBlur: shadow,
            });
            konvaLayer.add(fgImg);
            imgConfig.konva.fgImg = fgImg;
        }else{
            if(imgConfig.konva.fgImg.cornerRadius() !== radius){
                imgConfig.konva.fgImg.cornerRadius(radius);
            }
            if(imgConfig.konva.fgImg.shadowBlur() !== shadow){
                imgConfig.konva.fgImg.shadowBlur(shadow);
            }
            if(imgConfig.konva.fgImg.image() !== img){
                imgConfig.konva.fgImg.setAttrs({
                    image: img,
                    width: fgWidth,
                    height: fgHeight,
                    x: fgX,
                    y: fgY,
                });
            }
        }
        console.log('2!');

        // 底部区域的中线
        const bottomY = height * 0.925;
        // 底部文字区域宽度
        let groupWidth = 0;
        // 中间分割线宽度
        const lineWidth = fontSize * 0.15;
        // 间隔宽度
        const nopW = fontSize / 2;

        let textGroup = imgConfig.konva.textGroup;
        if(!textGroup){
            textGroup = new Konva.Group();
            konvaLayer.add(textGroup);
            imgConfig.konva.textGroup = textGroup;
        }
        // 绘制品牌logo
        if(logoImg){
            const widthLogo = logoImg.width;
            const heightLogo = logoImg.height;
            const logoHeightResize = fontSize / 0.45;
            const scale = logoHeightResize / heightLogo;
            // 非full尾标的图标才进行颜色变化
            if(!imgConfig.logoImgUrl || !imgConfig.logoImgUrl.toLowerCase().endsWith("_full.png")){
                await convertLogoColor(logoImg, fontColor, logoHeightResize);
            }
            const attrs = {
                image: logoImg,
                width: widthLogo * scale,
                height: heightLogo * scale,
                offsetY: heightLogo * scale * 0.25,
            };
            let logoImgObj = imgConfig.konva.logoImgObj;
            if(!logoImgObj){
                logoImgObj = new Konva.Image(attrs);
                textGroup.add(logoImgObj);
                imgConfig.konva.logoImgObj = logoImgObj;
            }else{
                logoImgObj.setAttrs(attrs);
            }
            groupWidth += logoImgObj.width();
        }
        // 绘制型号文字
        if(modelText){
            const attrs = {
                x: groupWidth + nopW,
                text: modelText,
                fontSize: fontSize,
                fontFamily: font,
                fill: fontColor,
            };
            let modelTextObj = imgConfig.konva.modelTextObj;
            if(!modelTextObj){
                modelTextObj = new Konva.Text(attrs);
                textGroup.add(modelTextObj);
                imgConfig.konva.modelTextObj = modelTextObj;
            }else{
                modelTextObj.setAttrs(attrs);
            }
            groupWidth += nopW + modelTextObj.width();
        }
        // 绘制中间分割线
        if((modelText || logoImg) && exifText){
            const attrs = {
                points: [groupWidth + nopW, 0, groupWidth + nopW, fontSize],
                stroke: fontColor,
                strokeWidth: lineWidth,
            };
            let lineObj = imgConfig.konva.lineObj;
            if(!lineObj){
                lineObj = new Konva.Line(attrs);
                textGroup.add(lineObj);
                imgConfig.konva.lineObj = lineObj;
            }else{
                lineObj.setAttrs(attrs);
            }
            groupWidth += nopW + lineObj.width();
        }
        // 绘制exif参数信息
        if(exifText){
            const attrs = {
                x: groupWidth + nopW,
                text: exifText,
                fontSize: fontSize,
                fontFamily: font,
                fill: fontColor,
            };
            let exifTextObj = imgConfig.konva.exifTextObj;
            if(!exifTextObj){
                exifTextObj = new Konva.Text(attrs);
                textGroup.add(exifTextObj);
                imgConfig.konva.exifTextObj = exifTextObj;
            }else{
                exifTextObj.setAttrs(attrs);
            }
            groupWidth += nopW + exifTextObj.width();
        }
        textGroup.x(width / 2 - groupWidth / 2);
        textGroup.y(bottomY - fontSize / 2);
    } catch (error) {
        console.error(error);
    }
    console.log('3!');
    layer.close(loadIndex);
}

/**
 * 导出当前预览区的图片
 */
function exportImg(){
    const index = layer.load(2);
    // 暂存缩放和偏移
    const scaleX = imgConfig.konva.stage.scaleX();
    const scaleY = imgConfig.konva.stage.scaleY();
    const x = imgConfig.konva.stage.x();
    const y = imgConfig.konva.stage.y();
    // 设置为原图尺寸
    imgConfig.konva.stage.width(imgConfig.konva.fullWidth);
    imgConfig.konva.stage.height(imgConfig.konva.fullHeight);
    imgConfig.konva.stage.scaleX(1);
    imgConfig.konva.stage.scaleY(1);
    imgConfig.konva.stage.x(0);
    imgConfig.konva.stage.y(0);
    // 获取图片数据
    const dataURL = imgConfig.konva.stage.toDataURL({pixelRatio: 1});
    // 恢复预览尺寸
    imgConfig.konva.stage.width(imgConfig.konva.containerWidth);
    imgConfig.konva.stage.height(imgConfig.konva.containerHeight);
    // 恢复缩放和偏移
    imgConfig.konva.stage.scaleX(scaleX);
    imgConfig.konva.stage.scaleY(scaleY);
    imgConfig.konva.stage.x(x);
    imgConfig.konva.stage.y(y);
    // 下载图片
    const link = document.createElement('a');
    link.href = dataURL;
    link.type = 'image/jpeg';
    link.download = 'export-image.jpg';
    link.click();
    layer.close(index);
}

function convertLogoColor(img, targetColor, heightResize){
    return new Promise((resolve, reject) => {
        let width = img.width;
        let height = img.height;
        const scale = heightResize / height;
        width *= scale;
        height *= scale;
        canvasTemp.width = width;
        canvasTemp.height = height;
        ctxTemp.save();
        // 绘制背景图片
        ctxTemp.drawImage(img, 0, 0, width, height);
        // 获取已绘制的图片，包含透明度
        const imageData = ctxTemp.getImageData(0, 0, width, height);
        const data = imageData.data;
        // 颜色转换
        const color = hexToRgb(targetColor);
        // 遍历像素数据，将黑色转换为白色
        for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            // 对于不透明的颜色转为对应的颜色
            if (a > 0) {
                data[i] = color.r;     // Red
                data[i + 1] = color.g; // Green
                data[i + 2] = color.b; // Blue
            }
        }
        ctxTemp.putImageData(imageData, 0, 0);
        ctxTemp.restore();
        img.src = canvasTemp.toDataURL();
        img.onload = () => {
            resolve();
        };
        img.onerror = () => reject(new Error('Image failed to load'));
    });
}

/**
 * 将十六进制颜色转换为 RGB 表示
 * @param {string} hex - 十六进制颜色代码，例如 '#FFFFFF'
 * @returns {object} - RGB 表示，例如 {r:255, g:255, b:255}
 */
function hexToRgb(hex) {
    // 移除可能存在的 '#' 符号
    hex = hex.replace(/^#/, '');
    // 处理 3 位和 6 位十六进制颜色代码
    if (hex.length === 4) {
        hex = hex.split('').map(function (char) {
            return char + char;
        }).join('');
    }
    // 将十六进制颜色代码转换为 RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return {r, g, b};
}


function formatValue(value, defaultValue){
    return value ? value : defaultValue;
}
function formatNumberValue(value, min, max, defaultValue){
    if(!value && value !== 0){
        return defaultValue;
    }
    return Math.min(Math.max(value, min), max);
}

