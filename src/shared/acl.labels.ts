export class AclDefinition {
  public static readonly USER_ADD = 'USER_ADD'
  public static readonly USER_DELETE = 'USER_DELETE'
  public static readonly USER_EDIT = 'USER_EDIT'
  public static readonly USER_CHANGE_PASSWORD = 'USER_CHANGE_PASSWORD'
  public static readonly USER_READ = 'USER_READ'
  public static readonly ACL_KEYS = 'ACL_KEYS'
  public static readonly ACL_CREATE_TEMPLATE = 'ACL_CREATE_TEMPLATE'
  public static readonly ACL_READ_TEMPLATE = 'ACL_READ_TEMPLATE'
  public static readonly ACL_DELETE_TEMPLATE = 'ACL_DELETE_TEMPLATE'

  // mandatory ACl [<scope>_ANY, <scope>_SUBORDINATE, <scope>_SELF]
  // employee command
  public static readonly EMPLOYEE_CREATE_SELF = 'EMPLOYEE_CREATE_SELF'
  public static readonly EMPLOYEE_CREATE_SUBORDINATE = 'EMPLOYEE_CREATE_SUBORDINATE'
  public static readonly EMPLOYEE_CREATE_ANY = 'EMPLOYEE_CREATE_ANY'

  public static readonly EMPLOYEE_UPLOAD_FILE_SELF = 'EMPLOYEE_UPLOAD_FILE_SELF'
  public static readonly EMPLOYEE_UPLOAD_FILE_SUBORDINATE = 'EMPLOYEE_UPLOAD_FILE_SUBORDINATE'
  public static readonly EMPLOYEE_UPLOAD_FILE_ANY = 'EMPLOYEE_UPLOAD_FILE_ANY'

  public static readonly EMPLOYEE_UPDATE_SELF = 'EMPLOYEE_UPDATE_SELF'
  public static readonly EMPLOYEE_UPDATE_SUBORDINATE = 'EMPLOYEE_UPDATE_SUBORDINATE'
  public static readonly EMPLOYEE_UPDATE_ANY = 'EMPLOYEE_UPDATE_ANY'

  public static readonly EMPLOYEE_DELETE_SELF = 'EMPLOYEE_DELETE_SELF'
  public static readonly EMPLOYEE_DELETE_SUBORDINATE = 'EMPLOYEE_DELETE_SUBORDINATE'
  public static readonly EMPLOYEE_DELETE_ANY = 'EMPLOYEE_DELETE_ANY'

  // eployee query
  public static readonly EMPLOYEE_READ_LIST_ANY = 'EMPLOYEE_READ_LIST_ANY'
  public static readonly EMPLOYEE_READ_LIST_SUBORDINATE = 'EMPLOYEE_READ_LIST_SUBORDINATE'

  public static readonly EMPLOYEE_READ_DETAIL_SELF = 'EMPLOYEE_READ_DETAIL_SELF'
  public static readonly EMPLOYEE_READ_DETAIL_SUBORDINATE = 'EMPLOYEE_READ_DETAIL_SUBORDINATE'
  public static readonly EMPLOYEE_READ_DETAIL_ANY = 'EMPLOYEE_READ_DETAIL_ANY'

  // contract query
  public static readonly EMPLOYEE_READ_CONTRACT_LIST_ANY = 'EMPLOYEE_READ_CONTRACT_LIST_ANY'
  public static readonly EMPLOYEE_READ_CONTRACT_LIST_SUBORDINATE = 'EMPLOYEE_READ_CONTRACT_LIST_SUBORDINATE'
  public static readonly EMPLOYEE_READ_CONTRACT_LIST_SELF = 'EMPLOYEE_READ_CONTRACT_LIST_SELF'

  // performance command
  public static readonly EMPLOYEE_PERFORMANCE_CREATE_SELF = 'EMPLOYEE_PERFORMANCE_CREATE_SELF'
  public static readonly EMPLOYEE_PERFORMANCE_CREATE_SUBORDINATE = 'EMPLOYEE_PERFORMANCE_CREATE_SUBORDINATE'
  public static readonly EMPLOYEE_PERFORMANCE_CREATE_ANY = 'EMPLOYEE_PERFORMANCE_CREATE_ANY'

  public static readonly EMPLOYEE_PERFORMANCE_UPDATE_SELF = 'EMPLOYEE_PERFORMANCE_UPDATE_SELF'
  public static readonly EMPLOYEE_PERFORMANCE_UPDATE_SUBORDINATE = 'EMPLOYEE_PERFORMANCE_UPDATE_SUBORDINATE'
  public static readonly EMPLOYEE_PERFORMANCE_UPDATE_ANY = 'EMPLOYEE_PERFORMANCE_UPDATE_ANY'

  public static readonly EMPLOYEE_PERFORMANCE_DELETE_SELF = 'EMPLOYEE_PERFORMANCE_DELETE_SELF'
  public static readonly EMPLOYEE_PERFORMANCE_DELETE_SUBORDINATE = 'EMPLOYEE_PERFORMANCE_DELETE_SUBORDINATE'
  public static readonly EMPLOYEE_PERFORMANCE_DELETE_ANY = 'EMPLOYEE_PERFORMANCE_DELETE_ANY'

  // performance query
  public static readonly EMPLOYEE_PERFORMANCE_READ_LIST_ANY = 'EMPLOYEE_PERFORMANCE_READ_LIST_ANY'
  public static readonly EMPLOYEE_PERFORMANCE_READ_LIST_SUBORDINATE = 'EMPLOYEE_PERFORMANCE_READ_LIST_SUBORDINATE'
  public static readonly EMPLOYEE_PERFORMANCE_READ_DETAIL_SELF = 'EMPLOYEE_PERFORMANCE_READ_DETAIL_SELF'
  public static readonly EMPLOYEE_PERFORMANCE_READ_DETAIL_SUBORDINATE = 'EMPLOYEE_PERFORMANCE_READ_DETAIL_SUBORDINATE'
  public static readonly EMPLOYEE_PERFORMANCE_READ_DETAIL_ANY = 'EMPLOYEE_PERFORMANCE_READ_DETAIL_ANY'

  // training
  public static readonly EMPLOYEE_ADD_TRAINING_SELF = 'EMPLOYEE_ADD_TRAINING_SELF'
  public static readonly EMPLOYEE_READ_TRAINING_SUBORDINATE = 'EMPLOYEE_READ_TRAINING_SUBORDINATE'
  public static readonly EMPLOYEE_READ_TRAINING_ANY = 'EMPLOYEE_READ_TRAINING_ANY'

  public alias: string
}

export const aclLabels: Map<string, AclDefinition> = new Map<string, AclDefinition>([
  [AclDefinition.USER_READ, { alias: 'Management View User' }],
  [AclDefinition.USER_ADD, { alias: 'Management Add User' }],
  [AclDefinition.USER_DELETE, { alias: 'Delete User' }],
  [AclDefinition.USER_EDIT, { alias: 'Edit User' }],
  [AclDefinition.USER_CHANGE_PASSWORD, { alias: 'Change Password' }],
  [AclDefinition.ACL_KEYS, { alias: 'Get Access Control Keys' }],
  [AclDefinition.ACL_CREATE_TEMPLATE, { alias: 'Create ACl template' }],
  [AclDefinition.ACL_READ_TEMPLATE, { alias: 'Read ACl template' }],
  [AclDefinition.ACL_DELETE_TEMPLATE, { alias: 'Delete ACl template' }],
  [AclDefinition.EMPLOYEE_CREATE_SELF, { alias: '' }],
  [AclDefinition.EMPLOYEE_CREATE_SUBORDINATE, { alias: '' }],
  [AclDefinition.EMPLOYEE_CREATE_ANY, { alias: '' }],
  [AclDefinition.EMPLOYEE_UPLOAD_FILE_SELF, { alias: '' }],
  [AclDefinition.EMPLOYEE_UPLOAD_FILE_SUBORDINATE, { alias: '' }],
  [AclDefinition.EMPLOYEE_UPLOAD_FILE_ANY, { alias: '' }],
  [AclDefinition.EMPLOYEE_UPDATE_SELF, { alias: '' }],
  [AclDefinition.EMPLOYEE_UPDATE_SUBORDINATE, { alias: '' }],
  [AclDefinition.EMPLOYEE_UPDATE_ANY, { alias: '' }],
  [AclDefinition.EMPLOYEE_DELETE_SELF, { alias: '' }],
  [AclDefinition.EMPLOYEE_DELETE_SUBORDINATE, { alias: '' }],
  [AclDefinition.EMPLOYEE_DELETE_ANY, { alias: '' }],
  [AclDefinition.EMPLOYEE_READ_LIST_ANY, { alias: '' }],
  [AclDefinition.EMPLOYEE_READ_LIST_SUBORDINATE, { alias: '' }],
  [AclDefinition.EMPLOYEE_READ_DETAIL_SELF, { alias: '' }],
  [AclDefinition.EMPLOYEE_READ_DETAIL_SUBORDINATE, { alias: '' }],
  [AclDefinition.EMPLOYEE_READ_DETAIL_ANY, { alias: '' }],
  [AclDefinition.EMPLOYEE_READ_CONTRACT_LIST_ANY, { alias: '' }],
  [AclDefinition.EMPLOYEE_READ_CONTRACT_LIST_SUBORDINATE, { alias: '' }],
  [AclDefinition.EMPLOYEE_READ_CONTRACT_LIST_SELF, { alias: '' }],
  [AclDefinition.EMPLOYEE_PERFORMANCE_CREATE_SELF, { alias: '' }],
  [AclDefinition.EMPLOYEE_PERFORMANCE_CREATE_SUBORDINATE, { alias: '' }],
  [AclDefinition.EMPLOYEE_PERFORMANCE_CREATE_ANY, { alias: '' }],
  [AclDefinition.EMPLOYEE_PERFORMANCE_UPDATE_SELF, { alias: '' }],
  [AclDefinition.EMPLOYEE_PERFORMANCE_UPDATE_SUBORDINATE, { alias: '' }],
  [AclDefinition.EMPLOYEE_PERFORMANCE_UPDATE_ANY, { alias: '' }],
  [AclDefinition.EMPLOYEE_PERFORMANCE_DELETE_SELF, { alias: '' }],
  [AclDefinition.EMPLOYEE_PERFORMANCE_DELETE_SUBORDINATE, { alias: '' }],
  [AclDefinition.EMPLOYEE_PERFORMANCE_DELETE_ANY, { alias: '' }],
  [AclDefinition.EMPLOYEE_PERFORMANCE_READ_LIST_ANY, { alias: '' }],
  [AclDefinition.EMPLOYEE_PERFORMANCE_READ_LIST_SUBORDINATE, { alias: '' }],
  [AclDefinition.EMPLOYEE_PERFORMANCE_READ_DETAIL_SELF, { alias: '' }],
  [AclDefinition.EMPLOYEE_PERFORMANCE_READ_DETAIL_SUBORDINATE, { alias: '' }],
  [AclDefinition.EMPLOYEE_PERFORMANCE_READ_DETAIL_ANY, { alias: '' }],
  [AclDefinition.EMPLOYEE_ADD_TRAINING_SELF, { alias: '' }],
  [AclDefinition.EMPLOYEE_READ_TRAINING_SUBORDINATE, { alias: '' }],
  [AclDefinition.EMPLOYEE_READ_TRAINING_ANY, { alias: '' }],
])
