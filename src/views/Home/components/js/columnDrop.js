// 三栏拖拽
import { ref } from "vue"

let leftWidth = 252

export let homeWidth = ref(`calc(100% - 252px)`)
export function dragControllerDivL () {
    let resizeL = document.getElementById('resizeL');
    let left = document.getElementById('homeLeft');


    resizeL.onmousedown = function (e) {
        let startX = e.clientX;  // 距离屏幕左边距离
        resizeL.left = resizeL.offsetLeft - 32;  // 当前点击元素距离左边的距离
        // 鼠标拖动事件
        document.onmousemove = function (e) {
            let endX = e.clientX;  // 到左侧的距离
            let moveLen = resizeL.left + (endX - startX);  //（endx - startx）= 移动的距离。resize[i].left + 移动的距离 = 左边区域最后的宽度
            if(moveLen < 160) moveLen = 160
            if(moveLen > 300) moveLen = 300

            left.style.width = moveLen + 'px'
            leftWidth = moveLen
            homeWidth.value = `calc(100% - ${leftWidth + 32}px)`
        }

        // 鼠标松开事件
        document.onmouseup = function (evt) {
            document.onmousemove = null;
            document.onmouseup = null;
            resizeL.releaseCapture && resizeL.releaseCapture(); // 当你不在需要继续获得鼠标消息就要应该调用ReleaseCapture()释放掉
        }
        resizeL.setCapture && resizeL.setCapture(); //该函数在属于当前线程的指定窗口里设置鼠标捕获
        return false;
    }
}

export let homeRightWidth = ref(`calc(100% - 230px)`)
export function dragControllerDivR () {
    let resizeR = document.getElementById('resizeR');
    let left = document.getElementById('homeRightLeft');

    resizeR.onmousedown = function (e) {
        let startX = e.clientX;  // 距离屏幕左边距离
        resizeR.left = resizeR.offsetLeft;  // 当前点击元素距离左边的距离

        // 鼠标拖动事件
        document.onmousemove = function (e) {
            let endX = e.clientX;
            let moveLen = resizeR.left + (endX - startX) - leftWidth - 24; // （endx-startx）= 移动的距离。resize[i].left+移动的距离 = 左边区域最后的宽度
            if(moveLen < 150) moveLen = 150
            if(moveLen > 300) moveLen = 300

            left.style.width = moveLen + 'px';
            homeRightWidth.value = `calc(100% - ${moveLen + 30}px)`
        }

        // 鼠标松开事件
        document.onmouseup = function (evt) {
            document.onmousemove = null;
            document.onmouseup = null;
            resizeR.releaseCapture && resizeR.releaseCapture(); //当你不在需要继续获得鼠标消息就要应该调用ReleaseCapture()释放掉
        }
        resizeR.setCapture && resizeR.setCapture(); //该函数在属于当前线程的指定窗口里设置鼠标捕获
        return false;
    }
}


