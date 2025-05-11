import { Directive, DirectiveBinding } from 'vue'

const codeColorStyleMap: { [key: string]: string } = {
  '0': '',
  '1': 'font-weight: bold;',
  '31': 'color: #F56C6C;',
  '33': 'color: #E6A23C;',
  '34': 'color: #409EFF;',
  '42': 'color: #67C23A;',
}

export function ansiToHtml(ansiString: string) {
  const ansiPattern = /(\x1B\[|\x9B)([\d;]+)?([a-zA-Z])[\x03\x1a]*/g
  let htmlString = ansiString
    .replace(ansiPattern, (match, prefix, codes: string, action) => {
      if (action === 'm') {
        const codeArray = codes.split(';')
        let style = codeArray.map((code) => codeColorStyleMap[code] || '').join('')
        return `<span style="${style}">`
      }
      return ''
    })
    .replace(/(\x1B\[|\x9B)([\d;]+)?([a-zA-Z])[\x03\x1a]*/g, '</span>')

  return htmlString
}

const useVAnsiHtml = () => {
  const vAnsiHtml: Directive<HTMLElement, string> = {
    mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
      el.innerHTML = ansiToHtml(binding.value)
    },
    updated(el: HTMLElement, binding: DirectiveBinding<string>) {
      el.innerHTML = ansiToHtml(binding.value)
    },
  }
  return vAnsiHtml
}

export default useVAnsiHtml
