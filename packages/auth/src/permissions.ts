import type { AbilityBuilder } from '@casl/ability'

import type { AppAbility } from '.'

import type { User } from './models/user'
import type { Role } from './roles'

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void

export const permissions: Record<Role, PermissionsByRole> = {
  super_admin(_user, { can }) {
    can('manage', 'all')
  },
  admin(_user, { can }) {
    can('manage', 'Tenant')
    can('manage', 'Product')
    can('manage', 'FinancialPartner')
    can('get', 'User')
  },
  financial(_user, { can }) {
    can('manage', 'Tenant')
    can('manage', 'Product')
    can('manage', 'FinancialPartner')
    can('get', 'User')
  },
  support(_user, { can }) {
    can('manage', 'Tenant')
    can('manage', 'Product')
    can('manage', 'FinancialPartner')
    can('get', 'User')
  },
  tenant_admin(_user, { can }) {
    // Acesso aos recursos do próprio tenant será controlado por condições (ex: where tenant_id = jwt.tenant_id) mais a frente
    can('get', 'Product')
    can('get', 'FinancialPartner')
    can('get', 'Tenant')
  },
  tenant_operator(_user, { can }) {
    can('get', 'Product')
    can('get', 'FinancialPartner')
    can('get', 'Tenant')
  },
}
