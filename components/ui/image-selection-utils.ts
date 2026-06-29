import type { Crop } from "react-image-crop";

const PRESET_LANDSCAPE = { width: 56, height: 40 };
const PRESET_PORTRAIT = { width: 56, height: 52 };
const PRESET_SQUARE = { width: 52, height: 52 };

type Size = {
  width: number;
  height: number;
};

function clampPercent(value: number) {
  return Math.min(96, Math.max(8, value));
}

export function createAdaptivePresetCrop(width: number, height: number): Crop {
  if (!width || !height) {
    return {
      unit: "%",
      x: 24,
      y: 24,
      width: PRESET_SQUARE.width,
      height: PRESET_SQUARE.height,
    };
  }

  const ratio = width / height;
  const preset = ratio > 1.15
    ? PRESET_LANDSCAPE
    : ratio < 0.88
      ? PRESET_PORTRAIT
      : PRESET_SQUARE;

  const cropWidth = clampPercent(preset.width);
  const cropHeight = clampPercent(preset.height);

  return {
    unit: "%",
    width: cropWidth,
    height: cropHeight,
    x: (100 - cropWidth) / 2,
    y: (100 - cropHeight) / 2,
  };
}

export function resolveMinSelectionSize(displaySize: Size): Size {
  const minEdge = Math.min(displaySize.width, displaySize.height);
  const minSize = Math.max(72, Math.round(minEdge * 0.18));

  return {
    width: Math.min(displaySize.width, minSize),
    height: Math.min(displaySize.height, minSize),
  };
}
