import type { CreateAbility, MongoAbility } from '@casl/ability'
import { AbilityBuilder, createMongoAbility } from '@casl/ability'

import { z } from 'zod'

import type { User } from './models/user'
import { permissions } from './permissions'

import { planSubject } from './subjects/plan'
import { productSubject } from './subjects/product'
import { subscriptionSubject } from './subjects/subscription'
import { userSubject } from './subjects/user'

export * from './models/user'
export * from './roles'

const appAbilitiesSchema = z.union([
  userSubject,
  planSubject,
  productSubject,
  subscriptionSubject,
  z.tuple([z.literal('manage'), z.literal('all')]),
])

type AppAbilities = z.infer<typeof appAbilitiesSchema>

export type AppAbility = MongoAbility<
  AppAbilities | [string, { __typename: string }]
>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: User) {
  const builder = new AbilityBuilder(createAppAbility)

  if (typeof permissions[user.role] !== 'function') {
    throw new Error(`Permissions for role ${user.role} not found.`)
  }

  permissions[user.role](user, builder)

  const ability = builder.build({
    detectSubjectType(subject) {
      return subject.__typename
    },
  })

  ability.can = ability.can.bind(ability)
  ability.cannot = ability.cannot.bind(ability)

  return ability
}
