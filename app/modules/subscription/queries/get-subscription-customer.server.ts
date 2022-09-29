import type { Subscription } from '@prisma/client'
import { db } from '~/utils'

/**
 * Queries.
 * @protected Template code.
 */
export const getSubscriptionCustomerById = async (
	customerId: Subscription['customerId'],
) => {
	return db.subscription.findUnique({ where: { customerId } })
}