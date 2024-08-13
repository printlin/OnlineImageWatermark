// 相机品牌logo文件名
const LOGO_FILENAMES = ["nikon", "nikon_full", "canon", "sony", "fujifilm", "hasselblad", "hasselblad-t", "leica", "leica_full",
    "leica_red_full", "red", "red_full", "dji", "install360", "kodak", "lumix", "mamiya", "olympus", "panasonic",
    "pentax", "phaseOne", "ricoh", "rolleiflex", "sigma", "tamron", "zeiss_full"];
const MAX_RADIUS = 500;
const MAX_BLUR = 500;
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

// 自定义变量
const LOGO_URL_PREFIX = "./static/imgs/logo/";
const imgConfig = {
    canvas: null,
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
        elem: '#blurSlider', value: 30, theme: '#1548e6',
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

    // 显示默认图片
    // imgSelected("./static/imgs/index.jpg");

    const block = document.getElementById('konvaContainerBlock').getBoundingClientRect();
    const stage = new Konva.Stage({
        container: 'konvaContainer',
        width: block.width,
        height: block.height,
    });
    const layer = new Konva.Layer();
    stage.add(layer);
    Konva.Image.fromURL('./static/imgs/index.jpg', function (darthNode) {
        darthNode.setAttrs({
            width: 5568,
            height: 3712,
            x: 130,
            y: 450,
            cornerRadius: 20,
        });
        layer.add(darthNode);
        stage.scaleX(0.18)
        stage.scaleY(0.2)
        console.log(1)
    });
    // 点击图片导出功能
    stage.on('click', () => {
        const w = stage.width();
        const h = stage.height();
        stage.width(5568)
        stage.height(3712)
        stage.scaleX(1)
        stage.scaleY(1)
        const dataURL = stage.toDataURL({ pixelRatio: 1 });
        stage.width(w)
        stage.height(h)
        stage.scaleX(0.2)
        stage.scaleY(0.2)
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'image.png';
        link.click();
    });
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
            });
            resolve();
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

        let width = img.width;
        let height = img.height;

        // // 如果图片高度超过1000px，等比例缩小
        // const maxHeight = 1000;
        // if (height > maxHeight) {
        //     const scale = maxHeight / height;
        //     width *= scale;
        //     height *= scale;
        // }

        // 绘制背景图片

        // 进行模糊处理
        console.log('1!');

        // 计算前景图片位置和大小
        let fgWidth = width * 0.8;
        let fgHeight = height * 0.8;
        let fgX = (width - fgWidth) / 2;
        let fgY = (height - fgHeight) * 0.25;
        const shadowOffset = 1;  // 阴影相对于前景图的偏移量，避免边框黑边问题

        // 绘制前景图片阴影

        // 绘制圆角矩形路径，
        fgX += shadowOffset;
        fgY += shadowOffset;
        fgWidth -= 2 * shadowOffset;
        fgHeight -= 2 * shadowOffset;


        // 绘制前景图片
        fgX -= shadowOffset;
        fgY -= shadowOffset;
        fgWidth += 2 * shadowOffset;
        fgHeight += 2 * shadowOffset;


        console.log('2!');
        // 底部文字区域
        let widthLogo = 0;
        let heightLogo = 0;
        let modelTextWidth = 0;
        let exifTextWidth = 0;
        // 中间分割线宽度
        const lineWidth = fontSize * 0.15;
        // 设置字体样式和大小

        // 设置文本基线对齐方式为中间

        // 文字填充颜色

        // 获取文本的宽度
        if(modelText){
            modelTextWidth = 0;
        }
        if(exifText){
            exifTextWidth = 0;
        }

        // 品牌logo尺寸
        if(logoImg){
            widthLogo = logoImg.width;
            heightLogo = logoImg.height;
            const logoHeightResize = fontSize / 0.45;
            const scale = logoHeightResize / heightLogo;
            widthLogo *= scale;
            heightLogo *= scale;
            // full尾标的图标不进行颜色变化
            if(!imgConfig.logoImgUrl || !imgConfig.logoImgUrl.toLowerCase().endsWith("_full.png")){
                await convertLogoColor(logoImg, fontColor, logoHeightResize);
            }
        }

        // 间隔宽度
        const nopW = fontSize / 2;
        // 底部区域的起始点
        const bottomX = width / 2 - (widthLogo + nopW + modelTextWidth + nopW + lineWidth + nopW + exifTextWidth) / 2;
        // 底部区域的中线
        const bottomY = height - (height - fgHeight) * 0.375;
        if(logoImg){
            // 绘制logo
            // ctx.drawImage(logoImg, bottomX, bottomY - heightLogo / 2, widthLogo, heightLogo);
        }
        if(modelText){
            // 绘制型号文字
            // ctx.fillText(modelText, bottomX + widthLogo + nopW, bottomY);
        }
        if((modelText || logoImg) && exifText){
            // 绘制中间分割线
            // ctx.beginPath();
            // ctx.lineWidth = lineWidth;
            // ctx.moveTo(bottomX + widthLogo + nopW + modelTextWidth + nopW + lineWidth / 2, bottomY - fontSize / 2);
            // ctx.lineTo(bottomX + widthLogo + nopW + modelTextWidth + nopW + lineWidth / 2, bottomY + fontSize / 2);
            // ctx.strokeStyle = fontColor;
            // ctx.stroke();
        }
        if(exifText){
            // 绘制exif参数信息
            // ctx.fillText(exifText, bottomX + widthLogo + nopW + modelTextWidth + nopW + lineWidth + nopW, bottomY);
        }
        layer.close(loadIndex);
    } catch (error) {
        console.error(error);
        layer.close(loadIndex);
    }
    console.log('3!');
}


function exportImg(){
    // 将 Canvas 转换为数据 URL
    const dataURL = canvas.toDataURL('image/jpg');

    // 创建一个临时的下载链接
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'canvas-image.jpg'; // 设置下载文件的名称
    // 触发下载
    link.click();
}

function convertLogoColor(img, targetColor, heightResize){
    return new Promise((resolve, reject) => {
        let width = img.width;
        let height = img.height;
        const scale = heightResize / height;
        width *= scale;
        height *= scale;
        // canvasTemp.width = width;
        // canvasTemp.height = height;
        // ctxTemp.save();
        // 绘制背景图片
        // ctxTemp.drawImage(img, 0, 0, width, height);
        // 获取已绘制的图片，包含透明度
        // const imageData = ctxTemp.getImageData(0, 0, canvas.width, canvas.height);
        // const data = imageData.data;
        // 颜色转换
        // const color = hexToRgb(targetColor);
        // // 遍历像素数据，将黑色转换为白色
        // for (let i = 0; i < data.length; i += 4) {
        //     const a = data[i + 3];
        //     // 对于不透明的颜色转为对应的颜色
        //     if (a > 0) {
        //         data[i] = color.r;     // Red
        //         data[i + 1] = color.g; // Green
        //         data[i + 2] = color.b; // Blue
        //     }
        // }
        // ctxTemp.putImageData(imageData, 0, 0);
        // ctxTemp.restore();
        // img.src = canvasTemp.toDataURL();
        // img.onload = () => {
        //     resolve();
        // };
        // img.onerror = () => reject(new Error('Image failed to load'));

        // 临时
        resolve();
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

