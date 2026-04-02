import type { AbilityBuilder } from '@casl/ability'

import type { AppAbility } from '.'

import type { User } from './models/user'
import type { Role } from './roles'

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void

export const permissions: Record<Role, PermissionsByRole> = {
  ADMIN(_user, { can }) {
    can('manage', 'all')
  },
  CONSULTANT(_user, { cannot, can }) {
    cannot('manage', 'Plan')

    can('get', 'Plan')
    can('get', 'Product')

    can(['create', 'get'], 'Subscription')

    // can(['create', 'get'], 'Project')
    // can(['update', 'delete'], 'Project', { ownerId: { $eq: user.id } })
  },
  SELLER(_user, { cannot }) {
    cannot('manage', 'Plan')
  },
}
