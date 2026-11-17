import { BaseLanguageDefinition, ILanguageDefinition } from './base.language.definition'

export class Language {
  public static use(lang: ILanguageDefinition = new BaseLanguageDefinition()): ILanguageDefinition {
    return lang
  }
}
