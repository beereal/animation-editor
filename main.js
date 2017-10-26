// Editor Class
class Editor {
    // Constructor
    constructor() {
        // Initialize Properties
        this.dom = [];
        this.canvas = document.querySelector('.canvas');

        // Initialize editors and render.
        this.initEditors();
        this.setListeners();
        this.changeTo('css', null);
        this.createIFrame();
        this.render(this.htmlEditor.getValue(), this.cssEditor.getValue());
    }

    // Initialize Code Editors
    initEditors() {
        // Initialize CSS Editor
        this.cssEditor = CodeMirror(document.querySelector('.css-editor'), {
            value: "/* CSS Code */\n.test { color: red; }",
            mode: "css",
            theme: "dracula",
            lineNumbers: true,
            //lint: true
        });
        // Initialize HTML Editor
        this.htmlEditor = CodeMirror(document.querySelector('.html-editor'), {
            value: '<!-- HTML Code -->\n<div class="test"><h1>Hello <span>World</span></h1></div>',
            mode: "htmlmixed",
            theme: "dracula",
            lineNumbers: true,
            //lint: true
        });
    }

    // Initialize Empty iFrame
    createIFrame() {
        // Create a new blank iframe
        this.iFrame = document.createElement('iframe');
        this.iFrame.width = '90%';
        this.iFrame.height = '90%';
        this.iFrame.src = 'about:blank';
        this.iFrame.frameBorder = '0';
        this.iFrame.scrolling = 'no';
        this.canvas.appendChild(this.iFrame);
        let content = `<!DOCTYPE html><html><head><title>Rendered Results</title></head><body></body></html>`;
        this.iFrame.contentWindow.document.open('text/html', 'replace');
        this.iFrame.contentWindow.document.write(content);
        this.iFrame.contentWindow.document.close();
    }

    // Set Listeners for editors
    setListeners() {
        this.cssEditor.on("change", (i, e) => {
            this.render(this.htmlEditor.getValue(), i.getValue());
        });

        this.cssEditor.on("blur", (i, e) => {
            this.cssEditor.setValue(css_beautify(this.cssEditor.getValue()));
        });

        this.htmlEditor.on("change", (i, e) => {
            this.render(i.getValue(), this.cssEditor.getValue());
        });

        this.htmlEditor.on("blur", (i, e) => {
            this.htmlEditor.setValue(html_beautify(this.htmlEditor.getValue()));
        });
    }

    // Switch between editors
    changeTo(code, option) {

        if (option) {
            document.querySelector(`.switch-code li.active`).className = '';
            option.className = "active";
        }

        this.unselectOptions();
        document.querySelector(`.${code}-editor`).style.display = 'block';
    }

    // Unselect any other editor
    unselectOptions() {
        document.querySelectorAll('div[class$="-editor"]').forEach(el => {
            el.style.display = 'none';
        });
    }

    // Render results on iFrame
    render(html, css) {
        this.iFrame.contentWindow.document.open('text/html', 'replace');
        this.iFrame.contentWindow.document.write(html + `<style>${css}</style>`);
        if (this.iFrame.contentWindow.document.body)
            this.iFrame.contentWindow.document.body.style.margin = 0;
        this.iFrame.contentWindow.document.close();
        this.dom = [];
        this.dom = this.scanElements(html);
        console.log(this.dom);
        this.renderSmart();
    }

    // Scan HTML Elements from Editor
    scanElements(html) {
        let regex = /<(\w+|(input|br|hr|img)).*?>(.|[\n\r\t\0])*?(<\/\1>|(?!\2))/g;
        let elements = html.match(regex);
        let result = [];
        if (Array.isArray(elements)) {
            elements.map(res => {
                let div = document.createElement('div');
                res = res.replace(/(\t+\n+)/g, '')
                div.innerHTML = res;
                let childNodes = Array.from(div.childNodes[0].childNodes);
                div.childNodes[0].innerHTML = '';
                let test = div.childNodes[0];
                let object = {
                    tagName: test.nodeName,
                    children: [],
                    classes: test.className.split(' ').filter(i => i !== '')
                };
                if (Array.isArray(childNodes) && childNodes.length) {
                    let children = childNodes.filter(e => e.nodeType === 1);
                    if (Array.isArray(children) && children.length) {
                        children.forEach(el => {
                            object.children.push(this.scanElements(el.outerHTML).shift());
                        });
                    }
                }
                result.push(object);
            });
        }

        return result;
    }

    // Render DOM Editor from HTML
    renderSmart() {
        let smart = document.querySelector('.smart-editor');
        smart.innerHTML = '';
        let ul = document.createElement('ul');
        this.dom.forEach(el => {
            ul.appendChild(this.renderSmartEl(el));
        });
        smart.appendChild(ul);
    }

    // Render DOM Element
    renderSmartEl(el) {
        let li = document.createElement('li');
        let a = document.createElement('a');
        let classesSpan = document.createElement('span');
        if (el.classes.length)
            classesSpan.innerHTML = `.${el.classes.join('.')}`;
        a.innerHTML = el.tagName;
        a.appendChild(classesSpan);
        a.appendChild(this.renderElView(el));
        // DOM Item OnClick
        a.addEventListener('click', e => {

            if (li.classList.contains('collapsable'))
                li.classList.toggle('collapsed');

            if (!a.classList.contains('selected')) {
                let selected = document.querySelector('.smart-editor .selected');
                if (selected !== null)
                    selected.classList.remove('selected');
                a.classList.add('selected');
            }

            e.stopPropagation();
        });

        li.appendChild(a);

        if (el.children && el.children.length) {
            li.className = "collapsable";
            let ul = document.createElement('ul');
            el.children.forEach(el => {
                ul.appendChild(this.renderSmartEl(el));
            });
            li.appendChild(ul);
        }

        return li;
    }

    // Render view toggle by element
    renderElView(el) {
        let a = document.createElement('a');
        let icon = document.createElement('i');
        a.className = 'view';
        icon.className = 'fa fa-eye';
        a.appendChild(icon);

        a.addEventListener('click', e => {
            if (icon.classList.contains('fa-eye')) {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
            e.stopPropagation();
        });

        return a;
    }
}

let editor = new Editor();