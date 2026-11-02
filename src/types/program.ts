export type ActivityType = {
  id: string
  ordering_seq: number
  code: string
  description: string
  notes: string
  timeline: {
    start: string
    end: string
  }
  proposed_milestone: string
  due_date: string
  is_checked?: boolean
}

export type ProjectType = {
  id: string
  ordering_seq: number
  code: string
  description: string
  is_checked?: boolean
  activities: ActivityType[]
}

export type DataResponseType = {
  program_id: string
  programs: ProjectType[]
}

export type ApiProjectsResponse = {
  message: string
  data: DataResponseType[]
}

export type FundReceived = {
  notes: string
  id: string
  documents: string | string[]
  amount: number
  source: string
  created_at: Date
  created_by: {
    id: string
    name: string
    pass_photo: string
  }
}
