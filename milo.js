Milo.elements = [];
function Milo(options = {}) {
    this.opt = Object.assign(
        {
            destroyOnClose: true,
            closeMethods: ["button", "overlay", "escape"],
            cssClass: [],
            footer: false,
        },
        options
    );
    this.template = document.querySelector(`#${this.opt.templateId}`);

    if (!this.template) {
        console.log(`#${this.opt.templateId} is does not exist`);
        return;
    }

    const { closeMethods } = this.opt;
    this._allowButtonClose = closeMethods.includes("button");
    this._allowBackdropClose = closeMethods.includes("overlay");
    this._allowEscapeClose = closeMethods.includes("escape");

    this._handleEscapeKey = this._handleEscapeKey.bind(this);
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
    const content = this.template.content.cloneNode(true);

    //create modal elements
    this._backdrop = document.createElement("div");
    this._backdrop.className = "milo__backdrop";

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

    const modalContent = document.createElement("div");
    modalContent.className = "milo__content";

    //Append content and Elements
    modalContent.append(content);
    container.append(modalContent);

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
    document.body.append(this._backdrop);
};

Milo.prototype.open = function () {
    Milo.elements.push(this);
    if (!this._backdrop) {
        this._build();
    }
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
    document.body.classList.add("milo--no-scroll");
    document.body.style.paddingRight = this._getScrollbarWidth() + "px";
    return this._backdrop;
};

Milo.prototype._handleEscapeKey = function (e) {
    const lastModal = Milo.elements[Milo.elements.length - 1];
    if (e.key === "Escape" && this === lastModal) {
        this.close();
    }
};

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
    if (!Milo.elements.length) {
        document.body.classList.remove("milo--no-scroll");
        document.body.style.paddingRight = "";
    }
};

Milo.prototype.destroy = function () {
    this.close(true);
};

Milo.prototype.setFooterContent = function (html) {
    this._footerContent = html;
    this._renderFooterContent();
};

Milo.prototype._footerButtons = [];

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
