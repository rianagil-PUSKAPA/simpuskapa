import * as bcrypt from 'bcrypt'

export class Password {
  private static saltRounds = 10

  public static createPassword(plainPassword: string): string {
    const salt = bcrypt.genSaltSync(this.saltRounds)
    const hash = bcrypt.hashSync(plainPassword, salt)
    return hash
  }

  public static verifyPassword(plainPassword: string, hashedPassword: string): boolean {
    return bcrypt.compareSync(plainPassword, hashedPassword)
  }
}
