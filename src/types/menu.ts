export interface IMenuChildren {
  name: string
}

export interface IMenu {
  id: string
  icon: string
  name: string
  children: IMenuChildren[] | boolean
}

export interface IMenuResponse {
  message: string
  data: IMenu[]
}
