import type { CreateAbility, MongoAbility } from '@casl/ability'
import { AbilityBuilder, createMongoAbility } from '@casl/ability'

import { z } from 'zod'

import type { User } from './models/user'
import { permissions } from './permissions'

import { financialPartnerSubject } from './subjects/financial-partner'
import { productSubject } from './subjects/product'
import { tenantSubject } from './subjects/tenant'
import { userSubject } from './subjects/user'

export * from './models/user'
export * from './roles'

const appAbilitiesSchema = z.union([
  userSubject,
  tenantSubject,
  productSubject,
  financialPartnerSubject,
  z.tuple([z.literal('manage'), z.literal('all')]),
])

type AppAbilities = z.infer<typeof appAbilitiesSchema>

export type AppAbility = MongoAbility<
  AppAbilities | [string, { __typename: string }]
>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: User) {
  const builder = new AbilityBuilder(createAppAbility)

  if (typeof permissions[user.user_role] !== 'function') {
    throw new Error(`Permissions for role ${user.user_role} not found.`)
  }

  permissions[user.user_role](user, builder)

  const ability = builder.build({
    detectSubjectType(subject) {
      return subject.__typename
    },
  })

  ability.can = ability.can.bind(ability)
  ability.cannot = ability.cannot.bind(ability)

  return ability
}
