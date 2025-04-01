interface ParsedKeyboardShortcut {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

interface ShortcutItem{
  parsed_shortcut: ParsedKeyboardShortcut,
  callback: (event: KeyboardEvent) => void;
  preventDefault: boolean;
}

interface ShortcutDescriptor{
  shortcut: string;
  callback: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

function isMac() {
  return navigator.userAgent.includes('Mac');
}

export class HotkeyHandler{
  private element: HTMLElement;
  private activeShortcuts: Map<string, ShortcutItem>;
  private options: any;
  
  constructor(element: HTMLElement, shortcuts: ShortcutDescriptor[] = [], options = {}) {
    const defaultOptions = {
      capturePhase: false, // Whether to use capture phase for event listener
      stopPropagation: false, // Whether to stop event propagation
    };

    this.element = element;
    this.activeShortcuts = new Map();
    this.options = { ...defaultOptions, ...options };
  
    shortcuts.forEach(shortcut => {
      this.addShortcut(shortcut);
    });
    
    element.addEventListener('keydown', (e: KeyboardEvent) => {this.handleKeyDown(e)}, this.options.capturePhase);
  }

  private parseShortcut(shortcutString: string): ParsedKeyboardShortcut {
    const parts = shortcutString.split('+').map(part => part.trim().toLowerCase());
    const key = parts.pop()!;

    if (parts.length == 0)
      console.error(`Invalid shortcut: ${shortcutString}. No key specified.`);

    if (key.length !== 1)
      console.error(`Invalid key: ${shortcutString}. Only single character keys are allowed.`);

    const isCmdOrCtrl = parts.includes('cmdorctrl') || parts.includes('commandorctrl') || parts.includes('cmdorcontrol') || parts.includes('commandorcontrol');
    
    return {
      key: key,
      ctrl: parts.includes('control') || parts.includes('ctrl') || (isCmdOrCtrl && !isMac()),
      alt: parts.includes('alt'),
      shift: parts.includes('shift'),
      meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command') || (isCmdOrCtrl && isMac()),
    };
  }
  
  private matchesShortcut(event: KeyboardEvent, parsedShortcut: ParsedKeyboardShortcut): boolean {
    return (
      event.key.toLowerCase() === parsedShortcut.key &&
      event.ctrlKey === parsedShortcut.ctrl &&
      event.altKey === parsedShortcut.alt &&
      event.shiftKey === parsedShortcut.shift &&
      event.metaKey === parsedShortcut.meta
    );
  }
  
  private handleKeyDown(event: KeyboardEvent) {
    for (const [_, shortcutObj] of this.activeShortcuts.entries()) {
      const { parsed_shortcut, callback, preventDefault } = shortcutObj;
      if (this.matchesShortcut(event, parsed_shortcut)) {
        if (preventDefault) {
          event.preventDefault();
        }
        
        if (this.options.stopPropagation) {
          event.stopPropagation();
        }
        
        callback(event);
        return;
      }
    }
  }
  
  addShortcut(shortcut: ShortcutDescriptor) {
    const { shortcut: shortcutKeys, callback, preventDefault } = shortcut;     
    const keysList = Array.isArray(shortcutKeys) 
      ? shortcutKeys
      : [shortcutKeys];
    
    keysList.forEach(keyCombo => {
      const id = `${keyCombo}-${Date.now()}`;
      const parsed_shortcut = this.parseShortcut(keyCombo);
      
      this.activeShortcuts.set(id, {
        parsed_shortcut,
        callback,
        preventDefault: preventDefault || true,
      });
    });
    
    return true;
  }
  
  // Function to remove a shortcut
  removeShortcut(keyCombo: string) {
    for (const [id, shortcutObj] of this.activeShortcuts.entries()) {
      if (shortcutObj.parsed_shortcut === this.parseShortcut(keyCombo)) {
        this.activeShortcuts.delete(id);
      }
    }
  }
  
  dispose() {
    this.element.removeEventListener('keydown', this.handleKeyDown, this.options.capturePhase);
    this.activeShortcuts.clear();
  } 
}