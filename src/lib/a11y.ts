const hexToRgb = (hex: string) => {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((char) => `${char}${char}`).join("") : value;
  return {
    b: parseInt(full.slice(4, 6), 16),
    g: parseInt(full.slice(2, 4), 16),
    r: parseInt(full.slice(0, 2), 16),
  };
};

const linearize = (channel: number) => {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
};

export const checkContrast = (foreground: string, background: string) => {
  const l1 = luminance(foreground);
  const l2 = luminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  if (import.meta.env.DEV && ratio < 4.5) {
    console.warn(`[A11Y] Contraste abaixo do recomendado: ${foreground} sobre ${background} = ${ratio.toFixed(2)}:1`);
  }

  return ratio;
};
