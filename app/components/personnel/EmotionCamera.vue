<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue'
import * as faceapi from '@vladmandic/face-api'

const emit = defineEmits<{
  detected: [
    {
      emotion: string
      confidence: number
    }
  ]
}>()

const videoRef = ref<HTMLVideoElement | null>(null)

const cameraActive = ref(false)
const loading = ref(false)
const modelLoaded = ref(false)
const detecting = ref(false)
const faceDetected = ref(false)

const errorMessage = ref('')
const detectedEmotion = ref('')
const confidence = ref(0)

let stream: MediaStream | null = null
let detectionTimer: ReturnType<typeof setInterval> | null = null

const emotionEmoji = computed(() => {
  switch (detectedEmotion.value.toLowerCase()) {
    case 'happy':
      return '😊'
    case 'sad':
      return '😔'
    case 'angry':
      return '😠'
    case 'fearful':
      return '😨'
    case 'disgusted':
      return '🤢'
    case 'surprised':
      return '😮'
    case 'neutral':
      return '😐'
    default:
      return '🙂'
  }
})

async function loadModels() {
  if (modelLoaded.value) return

  await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
  await faceapi.nets.faceExpressionNet.loadFromUri('/models')

  modelLoaded.value = true
}

async function startCamera() {
  if (cameraActive.value) return

  loading.value = true
  errorMessage.value = ''
  faceDetected.value = false
  detectedEmotion.value = ''
  confidence.value = 0

  try {
    await loadModels()

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: {
          ideal: 640
        },
        height: {
          ideal: 480
        }
      },
      audio: false
    })

    /*
     * Camera access successful.
     * Set cameraActive first so the video element is rendered.
     */
    cameraActive.value = true

    await nextTick()

    if (!videoRef.value) {
      throw new Error('Camera video element is unavailable')
    }

    videoRef.value.srcObject = stream

    await videoRef.value.play()

    startEmotionDetection()
  } catch (error) {
    console.error('Camera/emotion detection error:', error)

    cameraActive.value = false

    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      stream = null
    }

    errorMessage.value =
      'Unable to access the camera. Please allow camera permission and try again.'
  } finally {
    loading.value = false
  }
}

function startEmotionDetection() {
  if (detectionTimer) {
    clearInterval(detectionTimer)
  }

  detectionTimer = setInterval(async () => {
    if (!videoRef.value || !cameraActive.value || detecting.value) {
      return
    }

    if (
      videoRef.value.readyState <
      HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      return
    }

    detecting.value = true

    try {
      const result = await faceapi
        .detectSingleFace(
          videoRef.value,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.3
          })
        )
        .withFaceExpressions()

      if (!result) {
        faceDetected.value = false
        detectedEmotion.value = ''
        confidence.value = 0
        return
      }

      faceDetected.value = true

      const expressions = result.expressions

      const strongestEmotion = Object.entries(expressions)
        .sort(([, a], [, b]) => b - a)[0]

      if (!strongestEmotion) {
        return
      }

      const [emotion, score] = strongestEmotion

      detectedEmotion.value = emotion
      confidence.value = Number(score)

      emit('detected', {
        emotion,
        confidence: Number(score)
      })
    } catch (error) {
      console.error('Emotion detection failed:', error)
    } finally {
      detecting.value = false
    }
  }, 800)
}

function stopCamera() {
  if (detectionTimer) {
    clearInterval(detectionTimer)
    detectionTimer = null
  }

  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }

  if (videoRef.value) {
    videoRef.value.srcObject = null
  }

  cameraActive.value = false
  detecting.value = false
  faceDetected.value = false
  detectedEmotion.value = ''
  confidence.value = 0
}

function handleVisibilityChange() {
  if (document.hidden) {
    stopCamera()
  }
}

onMounted(() => {
  document.addEventListener(
    'visibilitychange',
    handleVisibilityChange
  )
})

onBeforeUnmount(() => {
  document.removeEventListener(
    'visibilitychange',
    handleVisibilityChange
  )

  stopCamera()
})
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

    <div>
      <p class="text-sm font-semibold uppercase tracking-wider text-blue-600">
        Step 1
      </p>

      <h2 class="mt-1 text-xl font-semibold text-slate-900">
        Facial Emotion Check
      </h2>

      <p class="mt-2 text-sm leading-6 text-slate-600">
        Allow camera access so Surakshit AI can analyse your facial expression.
        Your camera video is processed locally and is not uploaded or stored.
      </p>
    </div>

    <!-- Camera + Detection -->
    <div class="mt-6 grid gap-5 md:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">

      <!-- Camera -->
      <div class="overflow-hidden rounded-2xl bg-slate-900">

        <div
          v-if="!cameraActive"
          class="flex min-h-[280px] items-center justify-center px-6 text-center sm:min-h-[360px]"
        >
          <div>
            <div class="text-5xl">
              📷
            </div>

            <p class="mt-4 text-sm text-slate-300">
              Camera access is needed for emotion detection.
            </p>

            <button
              type="button"
              :disabled="loading"
              class="mt-5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              @click="startCamera"
            >
              {{ loading ? 'Starting Camera...' : 'Allow Camera Access' }}
            </button>
          </div>
        </div>

        <video
          v-else
          ref="videoRef"
          autoplay
          muted
          playsinline
          class="aspect-video w-full object-cover"
        />
      </div>

      <!-- Detection Result -->
      <div
        v-if="cameraActive"
        class="flex flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 p-5"
      >

        <!-- Camera Success -->
        <div
          class="rounded-xl border border-green-200 bg-green-50 px-4 py-3"
        >
          <div class="flex items-center gap-2">
            <span class="text-lg">✓</span>

            <p class="text-sm font-semibold text-green-700">
              Camera access successful
            </p>
          </div>

          <p class="mt-1 text-xs leading-5 text-green-600">
            Your camera is active and emotion analysis is running locally.
          </p>
        </div>

        <!-- Face Detected -->
        <div
          v-if="faceDetected"
          class="mt-4 rounded-xl bg-white p-4"
        >
          <div class="flex items-center gap-2">
            <span class="text-lg">✓</span>

            <p class="text-sm font-semibold text-green-700">
              Face detected
            </p>
          </div>

          <div class="mt-4 flex items-center justify-between gap-4">

            <div>
              <p class="text-xs font-medium text-slate-500">
                Detected Emotion
              </p>

              <div class="mt-1 flex items-center gap-2">
                <span class="text-3xl">
                  {{ emotionEmoji }}
                </span>

                <span class="text-xl font-bold capitalize text-slate-900">
                  {{ detectedEmotion || 'Detecting...' }}
                </span>
              </div>
            </div>

            <div
              v-if="detectedEmotion"
              class="text-right"
            >
              <p class="text-xs font-medium text-slate-500">
                Confidence
              </p>

              <p class="mt-1 text-xl font-bold text-slate-900">
                {{ Math.round(confidence * 100) }}%
              </p>
            </div>

          </div>
        </div>

        <!-- No Face -->
        <div
          v-else
          class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <div class="flex items-start gap-3">
            <span class="text-2xl">💡</span>

            <div>
              <p class="text-sm font-semibold text-amber-800">
                Can't detect a face
              </p>

              <p class="mt-1 text-xs leading-5 text-amber-700">
                Please move to a brighter area, face the camera directly,
                and make sure your face is clearly visible.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Camera Status -->
    <div
      v-if="cameraActive"
      class="mt-4 flex items-center justify-between gap-4"
    >
      <p class="text-xs leading-5 text-slate-500">
        Keep your face clearly visible and look toward the camera.
      </p>

      <button
        type="button"
        class="shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        @click="stopCamera"
      >
        Stop Camera
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="errorMessage"
      class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
    >
      {{ errorMessage }}
    </div>

  </section>
</template>