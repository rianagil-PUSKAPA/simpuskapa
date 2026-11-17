import { getDateNow, getEndOfJanuaryNextYear } from '@server/common/date.util'

describe('date:util', () => {
  it('date:now:only', () => {
    console.log('DATE NOW', getDateNow())
  })
  it('date:after:year', () => {
    console.log('DATE AFTER 1 YEAR', getEndOfJanuaryNextYear(getDateNow()))
  })
})
