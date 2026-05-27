export const decodeAzertyBarcode = (str: string): string => {
  const azertyToQwertyMap: Record<string, string> = {
    '&': '1',
    'é': '2',
    '"': '3',
    "'": '4',
    '(': '5',
    '-': '6',
    'è': '7',
    '_': '8',
    'ç': '9',
    'à': '0',
  };

  return str.split('').map(char => azertyToQwertyMap[char] || char).join('');
};
