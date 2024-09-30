const DragStates = {
    NONE: 0,
    STANDARD: 1,
    LIVE: 2
}

let tokenDragStates = {};
let isKeybindDown = false;
Hooks.on("init", function() {
    const MODULE_ID = 'live-drag'

    configureAccesibility();
    addSettings(MODULE_ID);

    libWrapper.register(MODULE_ID, 'Token.prototype._onDragLeftStart', (function() {
        return async function(wrapped, ...args) {      
            console.log(isKeybindDown)
            for (let t of canvas.tokens.controlled) {    
                if(args[0].shiftKey 
                    || game.settings.get(MODULE_ID, 'alwaysOn') 
                    || isKeybindDown) {
                    tokenDragStates[t.id] = DragStates.LIVE
                    changeTokenVisibility(t, 0);
                } else {
                    tokenDragStates[t.id] = DragStates.STANDARD;
                }
            }
            return wrapped.apply(this, args);
        }
    })(), 'WRAPPER');
});

Hooks.on("refreshToken", (token)=>{
    if(tokenDragStates[token.id] != DragStates.LIVE) return
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
    if(tokenDragStates[doc.id] === DragStates.LIVE) {
        options.animate = false;
    }
});

Hooks.on('updateToken', (doc, change, options) => {
    if(tokenDragStates[doc.id] === DragStates.LIVE) {
        const token = canvas.tokens.get(doc.id);
        changeTokenVisibility(token, 1);
        tokenDragStates[token.id] = DragStates.NONE;
    }
});

function changeTokenVisibility(token, newVisibility) {
    token.effects.alpha = newVisibility;
    token.nameplate.alpha = newVisibility;
    token.border.alpha = newVisibility;
    token.bars.alpha = newVisibility;
    token.target.alpha = newVisibility;
    token.targeted.alpha = newVisibility;
    token.tooltip.alpha = newVisibility;
    token.document.alpha = newVisibility;
}

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

    game.keybindings.register(MODULE_ID, 'keybind', {
        name: 'Live drag',
        hint: 'Enable live dragging',
        uneditable: [
            {
              key: "Shift"
            }
          ],
          editable: [
          ],
        restricted: false,
        onUp: () => {isKeybindDown = false;},
        onDown: () => {isKeybindDown = true;},
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });
}