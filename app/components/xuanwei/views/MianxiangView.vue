<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, shallowRef, useTemplateRef } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { mianxiangLookup } from '@/engine/knowledge/mianxiang'
import type { SymbolMatrix } from '@/engine/types'

const features = ['眉', '眼', '鼻', '口', '耳', '额', '颧', '下巴']
const selected = shallowRef('')
const matrix = shallowRef<SymbolMatrix | null>(null)
const cameraStarted = shallowRef(false)
const photo = shallowRef<string | null>(null)
const errorMessage = shallowRef('')
const video = useTemplateRef<HTMLVideoElement>('video')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const text = computed(() => matrix.value?.interpretations[0]?.text ?? '')
const note = computed(() => matrix.value?.interpretations[0]?.modernNote ?? '')
let stream: MediaStream | null = null

function stopCamera() {
  stream?.getTracks().forEach(track => track.stop())
  stream = null
  if (video.value) video.value.srcObject = null
  cameraStarted.value = false
}

async function startCamera() {
  errorMessage.value = ''
  stopCamera()
  if (!navigator.mediaDevices?.getUserMedia) {
    errorMessage.value = '当前浏览器或访问环境不支持摄像头，请使用支持 HTTPS 的现代浏览器。'
    return
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    cameraStarted.value = true
    await nextTick()
    if (video.value) video.value.srcObject = stream
  }
  catch (error) {
    stopCamera()
    errorMessage.value = error instanceof DOMException && error.name === 'NotAllowedError' ? '摄像头权限被拒绝。你可以在浏览器站点设置中允许后重试。' : '无法启动摄像头，请检查设备是否可用或是否被其他应用占用。'
  }
}

function capture() {
  if (!video.value || !canvas.value || !video.value.videoWidth) {
    errorMessage.value = '摄像头画面尚未准备好，请稍后再试。'
    return
  }
  canvas.value.width = video.value.videoWidth
  canvas.value.height = video.value.videoHeight
  const context = canvas.value.getContext('2d')
  if (!context) {
    errorMessage.value = '浏览器无法处理当前画面。'
    return
  }
  context.drawImage(video.value, 0, 0)
  photo.value = canvas.value.toDataURL('image/jpeg', 0.88)
  stopCamera()
}

async function retake() {
  photo.value = null
  selected.value = ''
  matrix.value = null
  await startCamera()
}

function lookup(feature: string) {
  selected.value = feature
  matrix.value = mianxiangLookup(feature)
}

onBeforeRouteLeave(stopCamera)
onBeforeUnmount(stopCamera)
</script>

<template><section class="xw-page"><header><h1>面相古籍对照</h1><p>拍照仅在本机浏览器处理，不上传服务器</p></header><div class="xw-stack"><XuanweiPanel title="拍照自观"><button v-if="!cameraStarted && !photo" class="xw-camera-start" type="button" @click="startCamera"><span aria-hidden="true">镜</span><strong>开启摄像头</strong><small>需要浏览器摄像头权限</small></button><div v-if="cameraStarted && !photo" class="xw-camera"><video ref="video" autoplay muted playsinline></video><div class="xw-face-frame" aria-hidden="true"></div></div><canvas ref="canvas" hidden></canvas><div v-if="photo" class="xw-photo"><img :src="photo" alt="刚刚拍摄的面部照片"><div class="xw-face-frame" aria-hidden="true"></div></div><p v-if="errorMessage" class="xw-error" role="alert">{{ errorMessage }}</p><div class="xw-action-row"><button v-if="cameraStarted && !photo" class="xw-action" type="button" @click="capture">拍照</button><button v-if="photo" class="xw-action xw-action-secondary" type="button" @click="retake">重新拍摄</button><button v-if="errorMessage && !cameraStarted" class="xw-action xw-action-secondary" type="button" @click="startCamera">重试</button></div></XuanweiPanel><XuanweiPanel v-if="photo" title="选择部位查阅古籍条文"><div class="xw-feature-grid"><button v-for="feature in features" :key="feature" type="button" :aria-pressed="selected === feature" @click="lookup(feature)">{{ feature }}</button></div></XuanweiPanel><XuanweiPanel v-if="matrix" :title="`${selected}部条文`"><p class="xw-interpretation">{{ text }}</p><hr class="xw-divider"><p class="xw-result-note">{{ note }}</p></XuanweiPanel><XuanweiNotice tone="warning">本工具不进行人脸识别或自动判断，仅提供古籍条文对照；内容不具科学诊断依据。</XuanweiNotice></div></section></template>
