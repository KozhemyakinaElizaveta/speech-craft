import { IStorage } from "../types/storage";

export class ColorController {
  private colorButtons: HTMLButtonElement[];
  private storage: IStorage;
  private currentColor: string;

  constructor(defaultColor: string, storage: IStorage) {
    this.colorButtons = Array.from(
      document.querySelectorAll(".color-button")
    ) as HTMLButtonElement[];
    this.storage = storage;
    this.currentColor = defaultColor;

    this.setColor(defaultColor);
    
    this.colorButtons.forEach(button => {
      button.addEventListener("click", () => {
        const color = button.getAttribute("data-color");
        if (color) {
          this.setColor(color);
        }
      });
    });
  }

  // Добавляем новый метод для получения текущего цвета
  getColor(): string {
    return this.currentColor || this.storage.read("selectedColor") || "#FF0000";
  }

  setColor(color: string): void {
    const normalizedColor = color.toUpperCase();
    this.currentColor = normalizedColor;
    
    this.colorButtons.forEach(button => {
      const buttonColor = button.getAttribute("data-color");
      
      if (buttonColor === normalizedColor) {
        button.classList.add("color-button__selected");
        button.setAttribute("aria-selected", "true");
      } else {
        button.classList.remove("color-button__selected");
        button.setAttribute("aria-selected", "false");
      }
    });

    this.storage.write("selectedColor", normalizedColor);
  }
}