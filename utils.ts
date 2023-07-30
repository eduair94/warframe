export const fix_money = function (value: string) {
  const no_dots = value.replaceAll(",", ".");
  return parseFloat(no_dots);
};

export const bError = function (err: string) {
  return { error: err };
};

export const find_string = function (str: string, start: string, end: string) {
  const middle = str.split(start)[1]?.split(end)[0];
  return middle;
};
