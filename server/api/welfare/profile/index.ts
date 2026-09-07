import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

function formatJoinedDate(
  value: string | null | undefined,
): string {
  if (!value) return '—'

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

async function getProfile(userId: number) {
  const user = await db.orm.public.User.first({
    id: userId,
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Welfare officer not found',
    })
  }

  if (user.role !== 'OFFICER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Welfare officer access required',
    })
  }

  const assignment =
    await db.orm.public.UnitAssignment.first({
      personnelId: user.id,
    })

  let unitName = 'Not Assigned'
  let unitCode = '—'

  if (assignment) {
    const unit = await db.orm.public.Unit.first({
      id: assignment.unitId,
    })

    if (unit) {
      unitName = unit.name || 'Not Assigned'
      unitCode = unit.code || '—'
    }
  }

  return {
    name: user.name ?? '',
    role: 'Welfare Officer',
    serviceId: String(user.id),
    unitName,
    unitCode,
    email: user.email ?? '',
    phone: user.phone ?? '',
    joinedDate: formatJoinedDate(user.createdAt),
    lastLoginLabel: 'Not available',
    avatarUrl: user.profilePicture ?? null,
  }
}

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'OFFICER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Welfare officer access required',
    })
  }

  const method = getMethod(event)

  // ============================================================
  // GET /api/welfare/profile
  // ============================================================
  if (method === 'GET') {
    return await getProfile(authUser.userId)
  }

  // ============================================================
  // PUT /api/welfare/profile
  // ============================================================
  if (method === 'PUT') {
    const body = await readBody<{
      name?: string
      phone?: string
      email?: string
      profilePicture?: string | null
    }>(event)

    // ----------------------------------------------------------
    // Profile picture only update
    // ----------------------------------------------------------
    if (
      body.profilePicture !== undefined &&
      body.name === undefined &&
      body.phone === undefined &&
      body.email === undefined
    ) {
      if (
        body.profilePicture !== null &&
        typeof body.profilePicture !== 'string'
      ) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid profile picture',
        })
      }

      const profilePicture =
        body.profilePicture?.trim() || null

      const updatedUser =
        await db.orm.public.User
          .where({
            id: authUser.userId,
          })
          .update({
            profilePicture,
          })

      if (!updatedUser) {
        throw createError({
          statusCode: 404,
          statusMessage:
            'Welfare officer profile not found',
        })
      }

      return {
        success: true,
        message: profilePicture
          ? 'Profile picture updated successfully'
          : 'Profile picture removed successfully',
        profile: await getProfile(authUser.userId),
      }
    }

    // ----------------------------------------------------------
    // Normal profile update
    // ----------------------------------------------------------
    const name = body.name?.trim()
    const phone = body.phone?.trim() ?? ''
    const email = body.email?.trim()

    if (!name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name is required',
      })
    }

    if (!email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required',
      })
    }

    if (!email.includes('@')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email address',
      })
    }

    const allUsers =
      await db.orm.public.User.all()

    const duplicateEmail = allUsers.find(
      (user) =>
        user.id !== authUser.userId &&
        user.email?.toLowerCase() ===
          email.toLowerCase(),
    )

    if (duplicateEmail) {
      throw createError({
        statusCode: 409,
        statusMessage:
          'This email address is already in use',
      })
    }

    const updateData: {
      name: string
      phone: string
      email: string
      profilePicture?: string | null
    } = {
      name,
      phone,
      email,
    }

    if (body.profilePicture !== undefined) {
      if (
        body.profilePicture !== null &&
        typeof body.profilePicture !== 'string'
      ) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid profile picture',
        })
      }

      updateData.profilePicture =
        body.profilePicture?.trim() || null
    }

    await db.orm.public.User.where({
      id: authUser.userId,
    }).update(updateData)

    return await getProfile(authUser.userId)
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  })
})