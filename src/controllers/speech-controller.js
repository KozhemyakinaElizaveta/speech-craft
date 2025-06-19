import { Renderer } from "./renderer";
import { ShapeType } from "../types/shapes";

export class SpeechController {
  constructor(storage, figuresController, themeController, colorController, onUnsupported) {
    this.storage = storage;
    this.figuresController = figuresController;
    this.themeController = themeController;
    this.colorController = colorController;
    this.onUnsupported = onUnsupported || (() => {});
    this.isListening = false;
    this.recognition = null;
    this.control = null;
    this.inactivityTimer = null;
    this.inactivityTimeout = 30000;
    this.manualStop = false;
    this.toggleListening = this.toggleListening.bind(this);
    this.startListening = this.startListening.bind(this);
    this.stopListening = this.stopListening.bind(this);
    this.resetInactivityTimer = this.resetInactivityTimer.bind(this);
    this.handleInactivity = this.handleInactivity.bind(this);
    this.initSpeechControl();
  }

  initSpeechControl() {
    try {
      this.control = document.getElementById("speech");
      if (!this.control) {
        throw new Error("Кнопка голосового управления не найдена");
      }
      if (this.isSpeechSupported()) {
        this.setupSpeechRecognition();
      } else {
        this.onUnsupported("SpeechRecognition");
      }
    } catch (e) {
      console.error("Ошибка инициализации голосового управления:", e);
      this.onUnsupported("SpeechRecognition");
    }
  }

  isSpeechSupported() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'ru-RU';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.manualStop = false;
      this.control.classList.add("control-button-speech__enabled");
      this.resetInactivityTimer();
      console.log("Микрофон включен");
    };

    this.recognition.onspeechend = () => {
      console.log("Речь завершена");
      this.resetInactivityTimer();
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      console.log("Распознано:", transcript);
      this.processVoiceCommand(transcript);
      this.resetInactivityTimer();
    };

    this.recognition.onerror = (event) => {
      console.error("Ошибка распознавания:", event.error);
      this.stopListening();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.control.classList.remove("control-button-speech__enabled");
      console.log("Микрофон выключен");
      if (!this.manualStop && this.inactivityTimer) {
        setTimeout(() => this.startListening(), 500);
      }
    };

    this.control.addEventListener("click", this.toggleListening);
  }

  resetInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.inactivityTimer = setTimeout(this.handleInactivity, this.inactivityTimeout);
  }

  handleInactivity() {
    if (this.isListening) {
      console.log("Отключение из-за бездействия");
      this.stopListening();
    }
  }

  toggleListening() {
    if (this.isListening) {
      this.manualStop = true;
      this.stopListening();
    } else {
      this.manualStop = false;
      this.startListening();
    }
  }

  startListening() {
    if (!this.recognition) return;
    try {
      this.recognition.start();
    } catch (e) {
      console.error("Ошибка запуска микрофона:", e);
      setTimeout(() => this.startListening(), 1000);
    }
  }

  stopListening() {
    if (!this.recognition) return;
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    try {
      if (this.isListening) {
        this.recognition.stop();
      }
    } catch (e) {
      console.error("Ошибка остановки микрофона:", e);
    }
  }

  processVoiceCommand(command) {
    if (!command) return;
    const commands = {
      'добавь': this.handleAddCommand.bind(this),
      'добавить': this.handleAddCommand.bind(this),
      'создай': this.handleAddCommand.bind(this),
      'тема': this.handleThemeCommand.bind(this),
      'цвет': this.handleColorCommand.bind(this),
      'удали': this.handleDeleteCommand.bind(this),
      'удалить': this.handleDeleteCommand.bind(this)
    };
    for (const [cmd, handler] of Object.entries(commands)) {
      if (command.startsWith(cmd)) {
        const value = command.slice(cmd.length).trim();
        handler(value);
        return;
      }
    }
    console.log("Неизвестная команда:", command);
  }

  handleAddCommand(shapeCommand) {
    const shapeMap = {
      'круг': ShapeType.CIRCLE,
      'прямоугольник': ShapeType.RECTANGLE,
      'квадрат': ShapeType.SQUARE,
      'треугольник': ShapeType.TRIANGLE
    };
    for (const [shapeName, shapeType] of Object.entries(shapeMap)) {
      if (shapeCommand.includes(shapeName)) {
        const currentColor = this.colorController.getColor();
        this.figuresController.addShape(shapeType, currentColor);
        console.log("Добавлена фигура:", shapeType);
        return;
      }
    }
    console.log("Неизвестная форма:", shapeCommand);
  }

  handleThemeCommand(theme) {
    const themeMap = {
      'светлая': 'light',
      'тёмная': 'dark',
      'темная': 'dark',
      'системная': 'system'
    };
    for (const [themeName, themeValue] of Object.entries(themeMap)) {
      if (theme.includes(themeName)) {
        this.themeController.setTheme(themeValue);
        return;
      }
    }
  }

  handleColorCommand(color) {
    const colorMap = {
      'красный': '#FF0000',
      'синий': '#0000FF',
      'зелёный': '#00FF00',
      'жёлтый': '#FFFF00'
    };
    for (const [colorName, hexColor] of Object.entries(colorMap)) {
      if (color.includes(colorName)) {
        this.colorController.setColor(hexColor);
        return;
      }
    }
  }

  handleDeleteCommand(value) {
    const deleteMap = {
      'последний': 'last',
      'удали последний': 'last'
    };
    for (const [deleteCmd] of Object.entries(deleteMap)) {
      if (value.includes(deleteCmd)) {
        this.figuresController.deleteLast();
        return;
      }
    }
  }
}