export interface ILanguageDefinition {
  lang(tmplt: string, toReplace?: string[]): string
}

class BaseLanguageDefinition implements ILanguageDefinition {
  public static RESPONSE_CREATED = '{1} Successfully Created'
  public static RESPONSE_UPLOADED = '{1} Successfully Uploaded'
  public static RESPONSE_READ = 'Successfully Listing {1}'
  public static RESPONSE_UPDATED = '{1} Successfully Updated'
  public static RESPONSE_DELETED = '{1} Successfully Deleted'
  public static RESPONSE_UNAUTHORIZED = 'Unauthorized'
  public static RESPONSE_UNAUTHORIZED_ACCESS = 'Unauthorized access for {1}'
  public static RESPONSE_OK = 'Success'
  public static RESPONSE_ERROR = 'Something went wrong'
  public static VALIDATION_ERROR = 'Validation Error'
  public static BAD_REQUEST_ERROR = 'Bad Request'
  public static BAD_NOT_FOUND = 'Not Found'

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

export { BaseLanguageDefinition, BaseLanguageDefinition as LD }
