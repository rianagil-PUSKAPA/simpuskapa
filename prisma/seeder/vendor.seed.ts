import { Prisma, PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { faker } from '@faker-js/faker'
import { uploadObject } from '../../src/server/commands/s3uploader'
import { BucketsEnum } from '../../src/shared/file.system'

export async function seedVendor(prisma: PrismaClient) {
  const vendorTypes = {
    Goods: {
      categories: [
        ['ATK', '', ['Invoice', '']],
        ['IT/Peripherals', '', ['Invoice', 'Bukti Serah Terima/Berita Acara', 'Dokumen Bidding']],
        ['Printing', '', ['Invoice', 'SPK', 'Hasil/Luaran', 'Bukti Serah Terima/Berita Acara', 'Dokumen Bidding']],
        ['Equipment', '', ['Invoice', 'Bukti Serah Terima/Berita Acara', 'Dokumen Bidding']],
        ['Other', '', []],
      ],
    },
    Services: {
      categories: [
        ['Translator', '', ['Invoice', 'Kontrak', 'Hasil/Luaran']],
        ['Interpreter', '', ['Invoice', 'SPK']],
        ['Sign Language', '', ['Invoice', 'SPK']],
        ['Transcriber', '', ['Invoice', 'SPK', 'Hasil/Luaran']],
        ['Notulen', '', ['Invoice', 'SPK', 'Hasil/Luaran']],
        ['Proofreader', '', ['Invoice', 'SPK', 'Hasil/Luaran']],
        ['MC', '', ['Invoice', 'SPK']],
        ['Key Person', '', ['Undangan', 'ToR']],
        ['Moderator', '', ['Undangan', 'ToR']],
        ['Designer', '', ['Invoice', 'Kontrak', 'Hasil/Luaran', 'Bukti Serah Terima/Berita Acara']],
        ['Editor', '', ['Invoice', 'Kontrak', 'Hasil/Luaran']],
        ['Photographer', '', ['Invoice', 'SPK', 'Hasil/Luaran', 'Bukti Serah Terima/Berita Acara', 'Dokumen Bidding']],
        ['Videographer', '', ['Invoice', 'SPK', 'Hasil/Luaran', 'Bukti Serah Terima/Berita Acara', 'Dokumen Bidding']],
        ['Other', '', []],
      ],
    },
    Subscription: {
      categories: [
        ['Online Services', '', ['Invoice']],
        ['Software', '', ['Invoice']],
        ['Other', '', ['']],
        ['Internet & Telephone', '', ['']],
        ['Research Ethics', '', ['Invoice', 'Hasil/Luaran', 'Bukti Serah Terima/Berita Acara']],
      ],
    },
    Travel: {
      categories: [
        ['Airfare', 'ACTION_BY_OPERATIONAL', ['Undangan', 'ToR']],
        ['Perdiem', 'ACTION_BY_TRAVELLER', ['Undangan', 'ToR']],
        ['Transportation', 'ACTION_BY_TRAVELLER', ['Undangan', 'ToR']],
        ['Vehicle Rental', 'ACTION_BY_OPERATIONAL', ['Undangan', 'ToR']],
        ['Accomodation', 'ACTION_BY_OPERATIONAL', ['Undangan', 'ToR']],
        ['Other', 'ACTION_BY_TRAVELLER', ['Undangan', 'ToR']],
      ],
    },
    Event: {
      categories: [
        ['Accommodations', '', ['Invoice', 'Dokumen Bidding']],
        ['Food Services', '', ['Invoice', 'Dokumen Bidding']],
        ['Room Rental', '', ['Invoice', 'Dokumen Bidding']],
        ['Transportation', '', ['Invoice', 'Kontrak', 'Dokumen Bidding']],
        ['Item/Tools Rental', '', ['Invoice']],
        ['Travel Agent', '', ['Invoice', 'Kontrak', 'Dokumen Bidding']],
        ['Event Organizer', '', ['Invoice', 'Kontrak', 'SPK']],
        ['Other', ''],
      ],
    },
    Misc: {
      categories: [
        ['Insurance', '', ['Invoice', 'Kontrak', 'Dokumen Bidding']],
        [
          'Auditor',
          '',
          ['Invoice', 'ToR', 'Kontrak', 'Hasil/Luaran', 'Bukti Serah Terima/Berita Acara', 'Dokumen Bidding'],
        ],
        ['Other', '', ['']],
        [
          'Contractor',
          '',
          ['Invoice', 'ToR', 'Kontrak', 'SPK', 'Hasil/Luaran', 'Bukti Serah Terima/Berita Acara', 'Dokumen Bidding'],
        ],
      ],
    },
    Consultant: {
      categories: [
        ['Consultant', '', ['Invoice', 'ToR', 'Kontrak', 'Timesheet', 'Hasil/Luaran']],
        ['Other', '', []],
      ],
    },
  }

  const vendorTaxType = {
    Goods: 'SKIP',
    Services: 'CALCULATE',
    Subscription: 'SKIP',
    Travel: 'CALCULATE',
    Event: 'CALCULATE',
    Misc: 'CALCULATE',
    Consultant: 'CALCULATE',
  }

  // insert vendor type and categories

  for (const vType in vendorTypes) {
    const insertedType = await prisma.vendor_type.create({
      data: {
        name: vType,
        tax_calculation_type: vendorTaxType[vType],
      },
    })
    for (const category of vendorTypes[vType].categories) {
      await prisma.vendor_category_information.create({
        data: {
          vendor_type_id: insertedType.id,
          name: category[0],
          action_by: String(category[1]),
          attachment_list: category[2],
        },
      })
    }
  }

  const banks = ['BCA', 'BSI', 'Bank Jago', 'Bank Permata', 'BRI']
  const recommender = await prisma.employee.findMany({ take: 5 })

  const files: string[] = [
    'git-cheat-sheet-education.pdf',
    'html-cheat-sheet.pdf',
    'git-cheat-sheet-education.pdf',
    'html-cheat-sheet.pdf',
  ]

  files.forEach(async (fileName) => {
    await uploadObject(`${process.cwd()}/storage/${fileName}`, fileName, BucketsEnum.vendor_files, true)
  })

  for (let i = 0; i < 100; i++) {
    // get random employeeid
    const recommenderIdx = faker.datatype.number({ min: 0, max: 4 })
    const vendorAbouts = {
      name: faker.company.name(),
      description: faker.lorem.words(10),
      location: faker.address.city(),
      website: faker.internet.url(),
      recommended_by: recommender[recommenderIdx].id,
      pic: recommender[recommenderIdx].full_name,
      pic_photo: recommender[recommenderIdx].pass_photo_path,
      phone_number: faker.phone.number('+62_81#######'),
      email: faker.internet.email(),
      identity_path: [`${BucketsEnum.employee_cv}/${files[0]}`],
      npwp_path: [`${BucketsEnum.employee_cv}/${files[0]}`],
      cv_path: [`${BucketsEnum.employee_cv}/${files[0]}`],
      other_path: [`${BucketsEnum.employee_cv}/${files[0]}`],
    }

    const vendorTypes = await prisma.vendor_type.findMany({
      include: {
        vendor_category_information: {},
      },
    })

    const selectedType = vendorTypes[faker.datatype.number({ min: 0, max: vendorTypes.length - 1 })]

    const selectedCateory = await prisma.vendor_category_information.findMany({
      where: {
        vendor_type_id: selectedType.id,
      },
    })
    const vendorInserted = await prisma.vendor.create({
      data: {
        id: uuidv4(),
        vendor_type: selectedType.id,
        vendor_information: vendorAbouts,
        vendor_payment: {
          bank_name: banks[faker.datatype.number({ min: 0, max: banks.length - 1 })],
          bank_branch: faker.name.jobArea(),
          bank_acc_number: faker.datatype.uuid().replaceAll('-', ''),
          bank_acc_name: faker.name.lastName(),
          swift_code: faker.datatype.uuid().replaceAll('-', ''),
        },
      },
    })
    for (let x = 0; x < 3; x++) {
      await prisma.vendor_categories.create({
        data: {
          vendor_id: vendorInserted.id,
          vendor_category_info_id:
            selectedCateory[faker.datatype.number({ min: 0, max: selectedCateory.length - 1 })].id,
        },
      })
    }
  }

  const vendors = await prisma.vendor.findMany()
  vendors.forEach(async (v) => {
    await prisma.vendor_packages.create({
      data: {
        id: uuidv4(),
        name: faker.name.fullName(),
        vendor_id: v.id,
        unit: ['pcs', 'pax', 'box'][faker.datatype.number({ min: 0, max: 2 })],
        price: faker.datatype.number({
          precision: 0.1,
          min: 2000,
          max: 5000000,
        }),
        currency: ['IDR', 'USD'][faker.datatype.number({ min: 0, max: 1 })],
      },
    })
  })

  // seed tax tier setting

  console.log('vendor.seed')
}
