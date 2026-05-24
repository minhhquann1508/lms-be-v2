// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fill = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Font = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Border = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Alignment = any;

export const HEADER_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF4472C4' },
};

export const ORANGE_HEADER_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFED7D31' },
};

export const ALT_ROW_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF2F2F2' },
};

export const HEADER_FONT: Font = {
  name: 'Arial',
  size: 11,
  bold: true,
  color: { argb: 'FFFFFFFF' },
};

export const NORMAL_FONT: Font = {
  name: 'Arial',
  size: 11,
  color: { argb: 'FF000000' },
};

export const BORDER_THIN: Border = {
  top: 'thin',
  bottom: 'thin',
  left: 'thin',
  right: 'thin',
};

export const CELL_ALIGNMENT_LEFT: Alignment = {
  horizontal: 'left',
  vertical: 'middle',
  wrapText: true,
};

export function createHeaderCellStyle(fill: Fill = HEADER_FILL): Fill {
  return {
    fill,
    font: HEADER_FONT,
    border: BORDER_THIN,
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  };
}

export function createNormalCellStyle(): Fill {
  return {
    font: NORMAL_FONT,
    border: BORDER_THIN,
    alignment: CELL_ALIGNMENT_LEFT,
  };
}

export function applyAltRowFill(fill: Fill): Fill {
  return {
    font: NORMAL_FONT,
    border: BORDER_THIN,
    alignment: CELL_ALIGNMENT_LEFT,
    fill,
  };
}

export function createCorrectCellStyle(): Fill {
  return {
    font: { name: 'Arial', size: 11, bold: true },
    border: BORDER_THIN,
    alignment: CELL_ALIGNMENT_LEFT,
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } },
  };
}
