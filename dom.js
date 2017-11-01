function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}

function drawRect(offsetX, offsetY, width, height) {
    
    let div;

    if (document.getElementById('dom-editor-selection')) {
        div = document.getElementById('dom-editor-selection');
    } else {
        div = document.createElement('div');
        div.id = 'dom-editor-selection';
        div.style.zIndex = 99999;
        div.style.position = 'absolute';
        div.style.boxShadow = "inset 0 0 0 1px #4285f4";
    }

    div.style.top = offsetY;
    div.style.left = offsetX;
    div.style.width = width;
    div.style.height = height;
    document.body.appendChild(div);
}

function selectEl(id) {
    let el = document.getElementById(id);
    let offset = getOffset(el);
    let bodyRect = document.body.getBoundingClientRect();
    drawRect(offset.left, offset.top, el.offsetWidth, el.offsetHeight);
}