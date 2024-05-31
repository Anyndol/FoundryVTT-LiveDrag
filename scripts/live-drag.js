let liveDragging = false;
let shift = false;

Hooks.on("init", function() {
    const MODULE_ID = 'live-drag'

    libWrapper.register(MODULE_ID, 'Token.prototype._onDragLeftDrop', (function() {
        return async function(wrapped, ...args) {            
            for (let t of canvas.tokens.controlled) {
                t.document.alpha = 1;
                t.border.alpha = 1;
            }
            return wrapped.apply(this, args);
        }
    })(), 'WRAPPER');

    libWrapper.register(MODULE_ID, 'Token.prototype._onDragLeftMove', (function() {
        return async function(wrapped, ...args) {            
            liveDragging = args[0].shiftKey;
            for (let t of canvas.tokens.controlled) {
                t.document.alpha = 0;
                t.border.alpha = 0;
            }
            return wrapped.apply(this, args);
        }
    })(), 'WRAPPER');
});

Hooks.on("refreshToken", (token, tst)=>{
    if(!liveDragging) return
    if (!token.isPreview) return;
    if (!token.layer.preview.children.find(t=>t.id==token.id)) return;
    window.socketDrag.executeAsGM("showDrag", token.id, token.x, token.y);
});

Hooks.once("socketlib.ready", () => {
	window.socketDrag = socketlib.registerModule("live-drag");
	window.socketDrag.register("showDrag", (tokenId, x, y) => {
        liveDragging = true;
        const token = canvas.tokens.get(tokenId);
        token.document.update({x, y, animate: !token._noAnimation})
    });
});

Hooks.on('preUpdateToken', (doc, change, options) => {
    if(liveDragging) {
        options.animate = !liveDragging;
        liveDragging = false;
    }
});