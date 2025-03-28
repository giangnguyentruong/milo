Milo.elements = [];
function Milo(options = {}) {
    if (!options.templateId && !options.content) {
        return console.error("You must provide one of 'content' or 'templateId'.");
    }

    if (options.templateId && options.content) {
        options.templateId = null;
        console.warn("Both 'content' and 'templateId' are specified. 'content' will take precedence, and 'templateId' will be ignored");
    }

    if (options.templateId) {
        this.template = document.querySelector(`#${options.templateId}`);

        if (!this.template) {
        console.log(`#${options.templateId} is does not exist`);
        return;
       }
    }

    this.opt = Object.assign(
        {
            enableScrollLock: true,
            scrollLockTarget:() => document.body,
            destroyOnClose: true,
            closeMethods: ["button", "overlay", "escape"],
            cssClass: [],
            footer: false,
        },
        options
    );

    this.content = this.opt.content
    
    const { closeMethods } = this.opt;
    this._allowButtonClose = closeMethods.includes("button");
    this._allowBackdropClose = closeMethods.includes("overlay");
    this._allowEscapeClose = closeMethods.includes("escape");

    this._handleEscapeKey = this._handleEscapeKey.bind(this);
    this._footerButtons = [];
}

Milo.prototype._getScrollbarWidth = function () {
    if (!this._scrollbarWidth) {
        const div = document.createElement("div");
        Object.assign(div.style, {
            overflow: "scroll",
            position: "absolute",
            top: "-9999px",
        });
        document.body.appendChild(div);
        this._scrollbarWidth = div.offsetWidth - div.clientWidth;
        document.body.removeChild(div);
        return this._scrollbarWidth;
    }
    return this._scrollbarWidth;
};

Milo.prototype._build = function () {
    const contentNode = this.content ? document.createElement("div") : this.template.content.cloneNode(true);

    if (this.content) {
        contentNode.innerHTML = this.content
    }

    //create modal elements
    this._backdrop = document.createElement("div");
    this._backdrop.className = "milo";

    const container = document.createElement("div");
    container.className = "milo__container";

    this.opt.cssClass.forEach((className) => {
        if (typeof className === "string") {
            container.classList.add(className);
        }
    });

    if (this._allowButtonClose) {
        const closeBtn = this._createButtons("milo__close", "&times", () => {
            this.close();
        });
        container.append(closeBtn);
    }

    this._modalContent = document.createElement("div");
    this._modalContent.className = "milo__content";

    //Append content and Elements
    this._modalContent.append(contentNode);
    container.append(this._modalContent);

    if (this.opt.footer) {
        this._modalFooter = document.createElement("div");
        this._modalFooter.className = "milo__footer";

        this._renderFooterContent();

        this._footerButtons.forEach((button) => {
            this._modalFooter.append(button);
        });

        container.append(this._modalFooter);
    }

    this._backdrop.append(container);
};

Milo.prototype.open = function () {
    const isFirstIndex = Milo.elements.length === 0;
    Milo.elements.push(this);
    if (!this._backdrop) {
        this._build();
    }
    document.body.append(this._backdrop);
    setTimeout(() => {
        this._backdrop.classList.add("milo__backdrop--show");
    }, 0);

    this._ontransitionend(this.opt.onOpen);

    //Attach event listeners
    if (this._allowBackdropClose) {
        this._backdrop.onclick = (e) => {
            if (this._backdrop === e.target) {
                this.close();
            }
        };
    }

    if (this._allowEscapeClose) {
        document.addEventListener("keydown", this._handleEscapeKey);
    }

    //Disable scrolling
    if (this.opt.enableScrollLock) {
        const target = this.opt.scrollLockTarget();
        if (this._hasScrollBar(target) && isFirstIndex) {
           const targetPadRight = parseInt(getComputedStyle(target).paddingRight);
           target.classList.add("milo--no-scroll");
           target.style.paddingRight = targetPadRight + this._getScrollbarWidth() + "px";
        }
    }
    return this._backdrop;
};

Milo.prototype.setContent = function (content) {
    this.content = content
    if (this._modalContent) {
        this._modalContent.innerHTML = content;
    }
}

Milo.prototype._handleEscapeKey = function (e) {
    const lastModal = Milo.elements[Milo.elements.length - 1];
    if (e.key === "Escape" && this === lastModal) {
        this.close();
    }
};

Milo.prototype._hasScrollBar = function (target) {
    if ([document.documentElement, document.body].includes(target)) {
        return document.documentElement.scrollHeight > document.documentElement.clientHeight || 
        document.body.scrollHeight > document.body.clientHeight;
    }
    return target.scrollHeight > target.clientHeight;
}

Milo.prototype._ontransitionend = function (callback) {
    this._backdrop.ontransitionend = (e) => {
        if (e.propertyName !== "transform") return;
        if (typeof callback === "function") callback();
    };
};

Milo.prototype.close = function (destroy = this.opt.destroyOnClose) {
    Milo.elements.pop();
    this._backdrop.classList.remove("milo__backdrop--show");
    if (this._allowEscapeClose) {
        document.removeEventListener("keydown", this._handleEscapeKey);
    }
    this._ontransitionend(() => {
        if (this._backdrop && destroy) {
            this._backdrop.remove();
            this._backdrop = null;
            this._modalFooter = null;
        }
        if (typeof this.opt.onClose === "function") this.opt.onClose();
    });
    // Enable scrolling
    if (!Milo.elements.length && this.opt.enableScrollLock) {
        const target = this.opt.scrollLockTarget();
        if (this._hasScrollBar(target)) {
            target.classList.remove("milo--no-scroll");
            target.style.paddingRight = "";
        }
    }
};

Milo.prototype.destroy = function () {
    this.close(true);
};

Milo.prototype.setFooterContent = function (html) {
    this._footerContent = html;
    this._renderFooterContent();
};

Milo.prototype._createButtons = function (cssClass, title, callback) {
    const button = document.createElement("button");
    button.className = cssClass;
    button.innerHTML = title;
    button.onclick = callback;
    return button;
};

Milo.prototype.addFooterButton = function (cssClass, title, callback) {
    const button = this._createButtons(title, cssClass, callback);
    if (this._modalFooter) {
        this._modalFooter.append(button);
    }
    this._footerButtons.push(button);
};

Milo.prototype._renderFooterContent = function () {
    if (this._footerContent && this._modalFooter) {
        this._modalFooter.innerHTML = this._footerContent;
    }
};
