import {ChatInputCommandInteraction} from 'discord.js';

export const languages = {
  morse_code: {
    name: 'Morse Code',
    translations: {
      "0": "-----",
      "1": ".----",
      "2": "..---",
      "3": "...--",
      "4": "....-",
      "5": ".....",
      "6": "-....",
      "7": "--...",
      "8": "---..",
      "9": "----.",
      "a": ".-",
      "b": "-...",
      "c": "-.-.",
      "d": "-..",
      "e": ".",
      "f": "..-.",
      "g": "--.",
      "h": "....",
      "i": "..",
      "j": ".---",
      "k": "-.-",
      "l": ".-..",
      "m": "--",
      "n": "-.",
      "o": "---",
      "p": ".--.",
      "q": "--.-",
      "r": ".-.",
      "s": "...",
      "t": "-",
      "u": "..-",
      "v": "...-",
      "w": ".--",
      "x": "-..-",
      "y": "-.--",
      "z": "--..",
      ".": ".-.-.-",
      ",": "--..--",
      "?": "..--..",
      "!": "-.-.--",
      "-": "-....-",
      "/": "-..-.",
      "@": ".--.-.",
      "(": "-.--.",
      ")": "-.--.-",
      " ": "/",
    }
  },
  enchantment_table: {
    name: 'Enchantment Table',
    translations: {
      "a": '\u158b',
      "b": '\u154a',
      "c": '\u14f5',
      "d": '\u0a6e',
      "e": '\u14b7',
      "f": '\u2393',
      "g": '\u2ade',
      "h": '\u2ae7',
      "i": '\u00a6',
      "j": '\u205d',
      "k": '\u5fc4',
      "l": '\uA58e',
      "m": '\u27d3',
      "n": '\u31fc',
      "o": '\u0a6d',
      "p": '\u00a1',
      "q": '\u1451',
      "r": '\u2237',
      "s": '\u14ED',
      "t": '\u3131',
      "u": '\u2e1a',
      "v": '\u2ae8',
      "w": '\u2234',
      "x": '\ua718',
      "y": '\u2228',
      "z": '\u231C',
    }
  },
} as const

const encode = (text: string, language: string) => {
  if (!text || !language) {
    return text;
  }

  if (language === 'morse_code'){
    return text.toLowerCase().split("").map(char => {
      return languages[language].translations[char] ? languages[language].translations[char] + ' ' : char;
    }).join("").trim();
  } else {
    return text.toLowerCase().split("").map(char => {
      return languages[language].translations[char] ? languages[language].translations[char] : char;
    }).join("");
  }

}

const decode = (text: string, language: string) => {
  if (!text || !language) {
    return text;
  }

  const flipped = Object.fromEntries(Object
    .entries(languages[language].translations)
    .map(([key, value]) => [value, key]));

  if (language === 'morse_code'){
    return text.toLowerCase().split(" ").map(char => {
      return flipped[char] ? flipped[char] : char;
    }).join("");
  } else {
    return text.toLowerCase().split("").map(char => {
      return flipped[`${char}`] ? flipped[`${char}`] : char;
    }).join("");
  }
}
const TranscodeCommands = async (interaction: ChatInputCommandInteraction, subCommandGroup: string) => {
  if (!interaction.member || !interaction.guild || !interaction.options.get('function') || !interaction.options.get('language') || !interaction.options.get('text')) {
    return;
  }

  const language = interaction.options.getString('language')?.toLowerCase();
  const text = interaction.options.getString('text')?.toLowerCase();
  const func = interaction.options.getString('function')?.toLowerCase();

  if (func === 'decode') {
    await interaction.reply(decode(text ?? '', language ?? ''))
  } else {
    await interaction.reply(encode(text ?? '', language ?? ''))
  }
}

export default TranscodeCommands;

