const DragStates = {
    NONE: 0,
    STANDARD: 1,
    LIVE: 2
}

let currentDragState = DragStates.NONE;
let pressedKey = "";
Hooks.on("init", function() {
    const MODULE_ID = 'live-drag'

    configureAccesibility();
    addSettings(MODULE_ID);

    libWrapper.register(MODULE_ID, 'Token.prototype._onDragLeftStart', (function() {
        return async function(wrapped, ...args) {            
            if(args[0].shiftKey 
                || game.settings.get(MODULE_ID, 'alwaysOn') 
                || pressedKey === game.settings.get(MODULE_ID, 'keybind').toLowerCase()) {
                currentDragState = DragStates.LIVE
            } else {
                currentDragState = DragStates.STANDARD;
            }
            return wrapped.apply(this, args);
        }
    })(), 'WRAPPER');

    libWrapper.register(MODULE_ID, 'Token.prototype._onDragLeftMove', (function() {
        return async function(wrapped, ...args) {         
            if(currentDragState === DragStates.LIVE) {
                args[0].shiftKey = true;
                for (let t of canvas.tokens.controlled) {
                    t.document.alpha = 0;
                    t.border.alpha = 0;
                    t.bars.alpha = 0;
                }
            }
            return wrapped.apply(this, args);
        }
    })(), 'WRAPPER');

    libWrapper.register(MODULE_ID, 'Token.prototype._onDragLeftDrop', (function() {
        return async function(wrapped, ...args) {            
            if(currentDragState === DragStates.LIVE) {
                args[0].shiftKey = true;
            }
            return wrapped.apply(this, args);
        }
    })(), 'WRAPPER');
});

Hooks.on("refreshToken", (token)=>{
    if(currentDragState != DragStates.LIVE) return
    if (!token.isPreview) return;
    if (!token.layer.preview.children.find(t=>t.id==token.id)) return;
    window.socketDrag.executeForOthers("showDrag", token.id, token.x, token.y);
});

Hooks.once("socketlib.ready", () => {
	window.socketDrag = socketlib.registerModule("live-drag");
	window.socketDrag.register("showDrag", (tokenId, x, y) => {
        const token = canvas.tokens.get(tokenId);
        token.x = x;
        token.y = y;
        token.mesh.x = x + token.w/2;
        token.mesh.y = y + token.h/2;
    });
});

Hooks.on('preUpdateToken', (doc, change, options) => {
    if(currentDragState === DragStates.LIVE) {
        options.animate = false;
    }
});

Hooks.on('updateToken', (doc, change, options) => {
    if(currentDragState === DragStates.LIVE) {
        doc.alpha = 1;
        const token = canvas.tokens.get(doc.id);
        token.border.alpha = 1;
        token.bars.alpha = 1;
        currentDragState = DragStates.NONE;
    }
});

function configureAccesibility() {
    document.addEventListener('keydown', (event)=> {    
        pressedKey = event.key;
    });
    
    document.addEventListener('keyup', (event)=> {
        pressedKey = "";
    });
}

function addSettings(MODULE_ID){
    game.settings.register(MODULE_ID, 'alwaysOn', {
        name: 'Always live drag',
        hint: 'Every token dragging will be live by default',
        scope: 'client',
        config: true,
        type: Boolean,
        default: false,
        onChange: value => {}
    });

    game.settings.register(MODULE_ID, 'keybind', {
        name: 'Keybind',
        hint: 'An extra keybind besides shift to enable live dragging',
        scope: 'client',
        config: true,
        type: String,
        default: "",
        onChange: value => {}
    });
}