import { ApiProperty, ApiQuery } from '@nestjs/swagger'

import { HttpBaseResponse } from '@server/types/base.response.dto'
import { Partner } from './partner.dto'

export class ActivityTimeLine {
  @ApiProperty()
  start?: string
  @ApiProperty()
  end?: string
}

export class ProjectActivity {
  @ApiProperty()
  id?: string
  @ApiProperty()
  ordering_seq?: number
  @ApiProperty()
  code?: string
  @ApiProperty()
  description?: string
  @ApiProperty()
  notes?: string
  @ApiProperty()
  timeline?: ActivityTimeLine
  @ApiProperty()
  proposed_milestone: string
  @ApiProperty()
  due_date: string
}

export class Project {
  @ApiProperty()
  id?: string
  @ApiProperty()
  ordering_seq?: number
  @ApiProperty()
  code?: string
  @ApiProperty()
  description?: string
  @ApiProperty({ type: [ProjectActivity] })
  activities?: ProjectActivity[]
}

export class ProjectCreateRequest {
  @ApiProperty({ type: [Project] })
  projects: Project[]
}

export class ProjectListResponse extends HttpBaseResponse<Project[]> {
  @ApiProperty({ type: [Project] })
  data: Project[]
}
