let liveDragging = false;

Hooks.on("init", function() {
    const MODULE_ID = 'live-drag'

    libWrapper.register(MODULE_ID, 'Token.prototype._onDragLeftDrop', (function() {
        return async function(wrapped, ...args) {            
            for (let t of canvas.tokens.controlled) {
                t.document.alpha = 1;
                t.border.alpha = 1;
                t.bars.alpha = 1;
            }
            return wrapped.apply(this, args);
        }
    })(), 'WRAPPER');

    libWrapper.register(MODULE_ID, 'Token.prototype._onDragLeftMove', (function() {
        return async function(wrapped, ...args) {            
            liveDragging = args[0].shiftKey;
            if(liveDragging) {
                for (let t of canvas.tokens.controlled) {
                    t.document.alpha = 0;
                    t.border.alpha = 0;
                    t.bars.alpha = 0;
                }
            }
            return wrapped.apply(this, args);
        }
    })(), 'WRAPPER');
});

Hooks.on("refreshToken", (token, tst)=>{
    if(!liveDragging) return
    if (!token.isPreview) return;
    if (!token.layer.preview.children.find(t=>t.id==token.id)) return;
    window.socketDrag.executeForOthers("showDrag", token.id, token.x, token.y);
});

Hooks.once("socketlib.ready", () => {
	window.socketDrag = socketlib.registerModule("live-drag");
	window.socketDrag.register("showDrag", (tokenId, x, y) => {
        const token = canvas.tokens.get(tokenId);
        console.log(token);
        token.x = x;
        token.y = y;
        token.mesh.x = x + token.mesh.width/2;
        token.mesh.y = y + token.mesh.height/2;
    });
});

Hooks.on('preUpdateToken', (doc, change, options) => {
    if(liveDragging) {
        options.animate = !liveDragging;
        liveDragging = false;
    }
});