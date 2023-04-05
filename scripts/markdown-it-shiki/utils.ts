import type { IExtraProcessor } from './types'
import { ExtraPosition } from './types'
import { makeStyle } from './index'

/**
*
* This extra processor will parse strings like `filename=""`
* , get the file name in between the quotes,
* and wrap them in a div with the class `shiki-filename`
*
* @param matched - the result of the regex match
* @returns the element to be inserted
*/
export const FilenameProcessor: IExtraProcessor = {
  attrRe: /filename="([\w.\-_\/]+)"/,
  position: ExtraPosition.before,
  light: (matched) => {
    if (matched === null)
      return undefined

    return {
      tag: 'div',
      attrs: {
        class: 'shiki-filename',
      },
      content: matched[1],
    }
  },
}

export const CopyActionButton: IExtraProcessor = {
  position: ExtraPosition.before,
  light: () => {
    return {
      tag: 'div',
      attrs: {
        style: makeStyle([
          'background-color: transparent',
          'display: inline-block',
        ]),
        class: 'shiki-float-hover-show',
      },
      content: {
        tag: 'CodeCopyButton',
        attrs: {},
      },
    }
  },
  dark: null,
}

export const LangIndicator: IExtraProcessor = {
  position: ExtraPosition.before,
  light: (matched, lang) => {
    return {
      tag: 'div',
      attrs: {
        style: makeStyle([
          'background-color: transparent',
          'display: inline-block',
        ]),
        class: 'shiki-float-hover-show',
      },
      content: {
        tag: 'span',
        attrs: {
          class: 'font-mono',
          style: 'font-size: 0.6em;',
        },
        content: lang,
      },
    }
  },
  dark: null,
}
