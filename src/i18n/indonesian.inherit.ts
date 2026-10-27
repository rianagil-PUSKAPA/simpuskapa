import { BaseLanguageDefinition, ILanguageDefinition } from './base.language.definition'

class IndonesiaLanguageDefinition extends BaseLanguageDefinition implements ILanguageDefinition {
  public static RESPONSE_READ = 'Berhasil Mengambil Data {1}'

  lang(tmplt: string, toReplace?: string[]): string {
    let translated = tmplt

    if (toReplace) {
      let pointer = 1
      toReplace.forEach((r) => {
        translated = translated.replace(`{${String(pointer)}}`, r)
      })
      pointer++
    }
    return translated
  }
}

export { IndonesiaLanguageDefinition, IndonesiaLanguageDefinition as ILD }
