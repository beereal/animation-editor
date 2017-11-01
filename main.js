// Editor Class
class Editor {
    // Constructor
    constructor() {
        // Initialize Properties
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
        this.iFrameDoc = this.iFrame.contentWindow.document;
        let content = `<!DOCTYPE html><html><head><title>Rendered Results</title></head><body></body></html>`;
        this.iFrameDoc.open('text/html', 'replace');
        this.iFrameDoc.write(content);
        this.iFrameDoc.close();
    }

    // Set Listeners for editors
    setListeners() {

        // Every change render the results.
        this.cssEditor.on("change", (i, e) => {
            this.render(this.htmlEditor.getValue(), i.getValue());
        });

        // On blur beautify code
        this.cssEditor.on("blur", (i, e) => {
            this.cssEditor.setValue(css_beautify(this.cssEditor.getValue()));
        });

        // Every change render the results.
        this.htmlEditor.on("change", (i, e) => {
            this.render(i.getValue(), this.cssEditor.getValue());
        });

        // On blur beautify code
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

        // Add unique ID to each element
        html = html.replace(/<(\w+)(.*?)>/g, (match) => {
            return match.replace('>', ` id="${parseInt(Math.random() * Date.now())}">`);
        });

        // Render code on iFrame
        this.iFrameDoc.open('text/html', 'replace');
        this.iFrameDoc.write(html + `<style>${css}</style>`);
        if (this.iFrameDoc.body) {

            this.iFrameDoc.body.style.margin = 0;

            // Add script to iframe for DOM manipulation
            if (this.iFrameDoc.querySelector('script') === null) {
                let script = this.iFrameDoc.createElement('script');
                script.src = 'dom.js';
                this.iFrameDoc.body.appendChild(script);
            }
        }
        this.iFrameDoc.close();

        // Scan HTML & Render DOM Editor
        this.dom = [];
        this.dom = this.scanElements(this.getHtmlRendered(html));
        this.renderSmart();
    }

    // Scan HTML Elements from Editor
    scanElements(nodes) {
        let result = [];
        if (nodes.length) {
            nodes.forEach(node => {
                console.log(node);
                if (node.nodeType !== undefined && node.nodeType === 1) {
                    let object = {
                        id: node.id,
                        tagName: node.nodeName,
                        children: [],
                        classes: node.className.split(' ').filter(i => i !== '')
                    };
    
                    if (node.hasChildNodes()) {
                        object.children = this.scanElements(node.childNodes);
                    }
    
                    result.push(object);
                }
            });
        }

        return result;
    }

    // Convert HTML text to DOM
    getHtmlRendered(html) {
        let div = document.createElement('div');
        html = html.replace(/(\t+\n+)/g, '');
        div.innerHTML = html;

        return div.childNodes;
    }

    // Render DOM Editor from HTML
    renderSmart() {
        console.log(this.dom);
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

        // DOM Item OnClick (Selection)
        a.addEventListener('click', e => {
            if (!a.classList.contains('selected')) {
                let selected = document.querySelector('.smart-editor .selected');
                if (selected !== null)
                    selected.classList.remove('selected');
                a.classList.add('selected');
                this.iFrame.contentWindow.selectEl(el.id);
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
            a.appendChild(this.renderElExpand(el, li));
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
                this.iFrameDoc.getElementById(el.id).style.opacity = '0';
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                this.iFrameDoc.getElementById(el.id).style.opacity = '';
            }
            e.stopPropagation();
        });

        return a;
    }

    // Render accordion toggle by element
    renderElExpand(el, li) {
        let a = document.createElement('a');
        let icon = document.createElement('i');
        a.className = 'expand';
        icon.className = 'fa fa-plus';
        a.appendChild(icon);

        a.addEventListener('click', e => {

            li.classList.toggle('collapsed');
            if (icon.classList.contains('fa-plus')) {
                icon.classList.remove('fa-plus');
                icon.classList.add('fa-minus');
            } else {
                icon.classList.remove('fa-minus');
                icon.classList.add('fa-plus');
            }
            e.stopPropagation();
        });

        return a;
    }
}

let editor = new Editor();