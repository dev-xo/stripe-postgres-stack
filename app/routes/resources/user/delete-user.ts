import type { ActionFunction } from '@remix-run/node'
import type { AuthSession } from '~/modules/auth'
import { redirect, json } from '@remix-run/node'
import { authenticator, getSession, destroySession } from '~/modules/auth'
import { getUserByProviderIdIncludingSubscription } from '~/modules/user/queries'
import { deleteStripeCustomer } from '~/modules/stripe/mutations'
import { deleteUser } from '~/modules/user/mutations'

/**
 * Remix - Action.
 * @protected Template code.
 
 * Deletes current Stripe Customer. (If exists)
 * Deletes current User from database.
 */
export const action: ActionFunction = async ({ request }) => {
	/**
	 * Checks for Auth Session.
	 */
	const user = (await authenticator.isAuthenticated(
		request,
	)) as AuthSession | null

	if (user) {
		/**
		 * Checks database for Subscription Customer existence.
		 * On success: Deletes current Stripe Customer.
		 */
		const dbUser = await getUserByProviderIdIncludingSubscription(
			user.providerId,
		)

		if (dbUser && dbUser.subscription[0]?.customerId) {
			const customerId = dbUser.subscription[0].customerId
			await deleteStripeCustomer(customerId)
		}

		/**
		 * Deletes current User from database.
		 * This will also delete Subscription Model in cascade mode.
		 */
		const providerId = user.providerId
		await deleteUser(providerId)

		/**
		 * Destroys Auth Session and redirects with updated headers.
		 */
		let session = await getSession(request.headers.get('Cookie'))

		return redirect('/', {
			headers: {
				'Set-Cookie': await destroySession(session),
			},
		})
	}

	/**
	 * Whops!
	 */
	return json({}, { status: 400 })
}
