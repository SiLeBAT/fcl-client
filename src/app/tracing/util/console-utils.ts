const RESET_CONSOLE_STYLE_FLAG = '\u001b[0m';

export enum ConsoleTextColor {
  RED = '\u001b[1;31m',
  GREEN = '\u001b[1;32m',
  YELLOW = '\u001b[1;33m',
  BLUE = '\u001b[1;34m',
  PURPLE = '\u001b[1;35m',
  CYAN = '\u001b[1;36m',
}

export enum ConsoleBackgroundColor {
  RED = '\u001b[1;41m',
  GREEN = '\u001b[1;42m',
  YELLOW = '\u001b[1;43m',
  BLUE = '\u001b[1;44m',
  PURPLE = '\u001b[1;45m',
  CYAN = '\u001b[1;46m',
}

export function createColoredConsoleMsg(
  msg: string,
  textColor?: ConsoleTextColor,
  bgColor?: ConsoleBackgroundColor
): string {
  if (textColor === undefined && bgColor === undefined) {
    return msg;
  } else {
    let startFlag = textColor ?? '';
    startFlag += bgColor ?? '';
    return startFlag + msg + RESET_CONSOLE_STYLE_FLAG;
  }
}
