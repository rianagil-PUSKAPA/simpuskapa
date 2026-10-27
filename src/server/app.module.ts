import { CacheModule, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'

import { CommonPrismaClient } from '@server/common/prisma.client'
import { UserController } from '@server/controllers/user.controller'
import { AuthJwtMiddleware } from '@server/middleware/auth.jwt.middleware'
import { UserRepository } from '@server/repositories/user.repository'
import { UserService } from '@server/services/user.service'
import { EmployeeController } from './controllers/employee.controller'
import { EmployeePerformanceController } from './controllers/employee.performace.controller'

import { FileController } from './controllers/file.controller'
import { EmployeeContractRepository } from './repositories/employee.contract.repository'
import { EmployeePerformanceRepository } from './repositories/employee.performance.repository'
import { EmployeeRepository } from './repositories/employee.repository'
import { EmployeeTrainingRepository } from './repositories/employee.training.repository'
import { EmployeeService } from './services/employee.service'
import { TimeOffController } from './controllers/timeoff.controller'
import { TimeOffRequestService } from './services/time.off.request.service'
import { TimeOffQuotaRepository } from './repositories/time.off.quota.repository'
import { MetadataController } from './controllers/metadata.controller'
import { MetadataService } from './services/metadata.service'
import { VendorController } from './controllers/vendor.controller'
import { VendorService } from './services/vendor.service'
import { VendorRepository } from './repositories/vendor.repository'
import { VendorPackageRepository } from './repositories/vendor.package.repository'
import { PartnerController } from './controllers/partner.controller'
import { PartnerRepository } from './repositories/partner.repository'
import { PartnerService } from './services/partner.service'
import { ProgramController } from './controllers/program.controller'
import { ProgramRepository } from './repositories/program.repository'
import { ProgramService } from './services/program.service'
import { ProjectController } from './controllers/project.controller'
import { ProjectService } from './services/project.service'
import { ProjectRepository } from './repositories/project.repository'
import { ActivityRepository } from './repositories/activity.repository'
import { BudgetRepository } from './repositories/budget.repository'
import { RFController } from './controllers/rf.controller'
import { RfServiceService } from './services/rf.service'
import { RfRepository } from './repositories/rf.repository'
import { PRController } from './controllers/pr.controller'
import { PRServiceService } from './services/pr.service'
import { PRRepository } from './repositories/pr.repository'
import { GeneralRepository } from './repositories/general.repository'
import { CommonRedisClient } from './common/memached.client'
import { NotificationRepository } from './repositories/notification.repository'
import { MailRepository } from './repositories/mail.repository'
import { MailTransporter } from './commands/mail.transporter'

@Module({
  imports: [],
  controllers: [
    UserController,
    EmployeeController,
    EmployeePerformanceController,
    FileController,
    TimeOffController,
    MetadataController,
    VendorController,
    PartnerController,
    ProgramController,
    ProjectController,
    RFController,
    PRController,
  ],
  providers: [
    UserRepository,
    UserService,
    EmployeeService,
    TimeOffRequestService,
    VendorService,
    MailTransporter,
    CommonPrismaClient,
    CommonRedisClient,
    EmployeeRepository,
    EmployeePerformanceRepository,
    EmployeeContractRepository,
    EmployeeTrainingRepository,
    NotificationRepository,
    TimeOffQuotaRepository,
    GeneralRepository,
    VendorRepository,
    VendorPackageRepository,
    MetadataService,
    PartnerRepository,
    PartnerService,
    ProgramRepository,
    ProgramService,
    ProjectService,
    ProjectRepository,
    ActivityRepository,
    BudgetRepository,
    RfServiceService,
    RfRepository,
    PRServiceService,
    PRRepository,
    MailRepository,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthJwtMiddleware)
      .exclude(
        { path: '/v1/auth/login', method: RequestMethod.ALL },
        { path: '/v1/auth/login-arbitary', method: RequestMethod.ALL },
        { path: '/v1/auth/oauth/google', method: RequestMethod.GET },
        { path: '/v1/auth/oauth/google/callback', method: RequestMethod.GET },
        { path: '/v1/auth/refresh', method: RequestMethod.GET },
        { path: '/v1/files/(.*)', method: RequestMethod.ALL },
        { path: '/v1/files/(.*)', method: RequestMethod.ALL },
        { path: '/v1/vendors/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes(
        UserController,
        EmployeeController,
        EmployeePerformanceController,
        VendorController,
        TimeOffController,
        RFController,
        ProjectController,
        ProgramController,
        PRController,
        PartnerController,
        MetadataController,
        FileController,
      )
  }
}
