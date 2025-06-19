import { Renderer } from "./renderer";
import { ShapeType } from "../types/shapes";

export class GameState {
  constructor(storage) {
    this.storage = storage;
    this.isMainTab = false;
    this.mainTabId = null;
    this.tabId = this.generateId();
    this.heartbeatInterval = null;
    this.mainTabTimeout = null;
    this.initBroadcastChannel();
    this.setupEventListeners();
    this.initializeTabRole();
  }

  generateId() {
    return Math.random().toString(36).substring(2, 10);
  }

  initBroadcastChannel() {
    try {
      this.broadcastChannel = new BroadcastChannel('figures_sync');
    } catch (e) {
      console.error("BroadcastChannel initialization failed:", e);
      this.broadcastChannel = {
        postMessage: () => {},
        addEventListener: () => {},
        close: () => {}
      };
      this.isMainTab = true;
    }
  }

  setupEventListeners() {
    this.broadcastChannel.addEventListener('message', (event) => {
      if (!event?.data?.type) return;
      switch (event.data.type) {
        case 'state_update':
          this.handleStateUpdate(event);
          break;
        case 'heartbeat':
          this.handleHeartbeat(event);
          break;
        case 'new_main_tab':
          this.handleNewMainTab(event);
          break;
        case 'main_tab_closed':
          this.handleMainTabClosed();
          break;
      }
    });
    window.addEventListener('beforeunload', () => {
      if (this.isMainTab) {
        this.broadcastChannel.postMessage({
          type: 'main_tab_closed',
          tabId: this.tabId
        });
      }
      this.cleanup();
    });
    this.setupControlButtons();
  }

  handleStateUpdate(event) {
    if (!this.isMainTab && event.data.tabId === this.mainTabId) {
      this.storage.setState(event.data.state);
    }
  }

  handleHeartbeat(event) {
    if (event.data.isMain) {
      this.mainTabId = event.data.tabId;
      clearTimeout(this.mainTabTimeout);
      this.mainTabTimeout = setTimeout(() => this.promoteToMain(), 2000);
    }
  }

  handleNewMainTab(event) {
    if (this.isMainTab && event.data.tabId !== this.tabId) {
      this.becomeSecondaryTab();
    }
  }

  handleMainTabClosed() {
    if (!this.isMainTab && !document.hidden) {
      this.becomeMainTab();
    }
  }

  setupControlButtons() {
    const buttons = [
      { id: 'becomeMain', handler: this.becomeMainTab.bind(this) },
      { id: 'becomeSecondary', handler: this.becomeSecondaryTab.bind(this) },
      { id: 'deleteLast', handler: this.deleteLastShape.bind(this) }
    ];
    buttons.forEach(({ id, handler }) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('click', handler);
      }
    });
  }

  initializeTabRole() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isMainTab) {
        this.broadcastChannel.postMessage({
          type: 'heartbeat',
          isMain: true,
          tabId: this.tabId
        });
      }
    }, 500);
    setTimeout(() => {
      if (!this.mainTabId && !document.hidden) {
        this.becomeMainTab();
      }
    }, 500);
  }

  promoteToMain() {
    if (!this.isMainTab) {
      this.becomeMainTab();
    }
  }

  becomeMainTab() {
    this.isMainTab = true;
    this.mainTabId = this.tabId;
    this.updateUI();
    this.broadcastChannel.postMessage({
      type: 'new_main_tab',
      tabId: this.tabId
    });
    this.updateState(this.storage.getState());
  }

  becomeSecondaryTab() {
    this.isMainTab = false;
    this.updateUI();
  }

  deleteLastShape() {
    if (this.isMainTab) {
      const currentState = this.storage.getState();
      const newShapes = currentState.shapes.slice(0, -1);
      this.storage.setState({ ...currentState, shapes: newShapes });
      this.updateState(this.storage.getState());
    }
  }

  isMain() {
    return this.isMainTab;
  }

  updateState(state) {
    this.storage.setState(state);
    if (this.isMainTab) {
      this.broadcastChannel.postMessage({
        type: 'state_update',
        state: state,
        tabId: this.tabId
      });
    }
    const renderer = new Renderer("canvas", this.storage);
    renderer.render(state.shapes);
  }

  updateUI() {
    const elements = [
      { id: 'deleteLast', disabled: !this.isMainTab },
      { id: 'becomeMain', disabled: this.isMainTab },
      { id: 'becomeSecondary', disabled: !this.isMainTab }
    ];
    elements.forEach(({ id, disabled }) => {
      const element = document.getElementById(id);
      if (element) {
        element.disabled = disabled;
      }
    });
  }

  cleanup() {
    clearInterval(this.heartbeatInterval);
    clearTimeout(this.mainTabTimeout);
    this.broadcastChannel.close();
  }
}