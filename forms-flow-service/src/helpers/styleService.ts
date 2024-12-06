class StyleServices {
  //css variable fetcher utility
  public static getCSSVariable(
    variableName: string,
    element: HTMLElement = document.documentElement
  ): string {
    const value = getComputedStyle(element).getPropertyValue(variableName);
    return value === '" "' ? "" : value;
  }
}

export default StyleServices;
