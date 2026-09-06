export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const config = useRuntimeConfig()

  try {
    return await $fetch(`${config.mlServiceUrl}/predict`, {
      method: 'POST',
      body,
    })
  } catch (error) {
    console.error('ML prediction error:', error)

    throw createError({
      statusCode: 503,
      statusMessage: 'ML service is unavailable',
    })
  }
})