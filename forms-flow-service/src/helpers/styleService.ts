class StyleServices {
  //css variable fetcher utility
  public static getCSSVariable(
    variableName: string,
    element: HTMLElement = document.documentElement
  ): string {
    const value = getComputedStyle(element).getPropertyValue(variableName);
    return value === '" "' ? "" : value;
  }

  // Set CSS variable utility
  public static setCSSVariable(
    variableName: string,
    value: string,
    element: HTMLElement = document.documentElement
  ): void {
    element.style.setProperty(variableName, value);
  }
}

export default StyleServices;
