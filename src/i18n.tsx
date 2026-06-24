import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type Language = 'en' | 'zh'

type TranslationKey =
  | 'language'
  | 'theme'
  | 'camera'
  | 'cameraMotion'
  | 'cameraMode'
  | 'zoom'
  | 'intensity'
  | 'variant'
  | 'light'
  | 'dark'
  | 'openPanel'
  | 'closePanel'
  | 'showJson'
  | 'hideJson'
  | 'library'
  | 'effects'
  | 'canvas'
  | 'wallpaperCanvas'
  | 'openFullscreenPreview'
  | 'source'
  | 'appName'
  | 'uploadCopy'
  | 'chooseImage'
  | 'imageFormats'
  | 'enabled'
  | 'off'
  | 'add'
  | 'remove'
  | 'layers'
  | 'layerStack'
  | 'visible'
  | 'locked'
  | 'delete'
  | 'moveUp'
  | 'moveDown'
  | 'zIndex'
  | 'presets'
  | 'inspector'
  | 'noLayerSelected'
  | 'baseImageLayer'
  | 'count'
  | 'speed'
  | 'opacity'
  | 'projectPackage'
  | 'copySpecJson'
  | 'downloadSpecJson'
  | 'downloadPackage'
  | 'preparingPackage'
  | 'packageDownloaded'
  | 'packageExportFailed'
  | 'copied'
  | 'emptySpec'
  | 'noSpecFound'
  | 'background'
  | 'glowParticles'
  | 'petals'
  | 'snow'
  | 'rain'
  | 'fireflies'
  | 'fog'
  | 'lightRays'
  | 'stars'
  | 'glowParticlesDesc'
  | 'petalsDesc'
  | 'snowDesc'
  | 'rainDesc'
  | 'firefliesDesc'
  | 'fogDesc'
  | 'lightRaysDesc'
  | 'starsDesc'

const TRANSLATIONS: Record<Language, Record<TranslationKey, string>> = {
  en: {
    language: '中文',
    theme: 'Theme',
    camera: 'Camera',
    cameraMotion: 'Camera Motion',
    cameraMode: 'Mode',
    zoom: 'zoom',
    intensity: 'intensity',
    variant: 'variant',
    light: 'Light',
    dark: 'Dark',
    openPanel: 'Open inspector',
    closePanel: 'Close inspector',
    showJson: 'Show JSON',
    hideJson: 'Hide JSON',
    library: 'Library',
    effects: 'Effects',
    canvas: 'Canvas',
    wallpaperCanvas: 'Wallpaper Canvas',
    openFullscreenPreview: 'Open fullscreen preview',
    source: 'Source',
    appName: 'AI Wallpaper Engine',
    uploadCopy: 'Import an image to create the first wallpaper preview.',
    chooseImage: 'Choose image',
    imageFormats: 'PNG, JPG, GIF, or WebP',
    enabled: 'Enabled',
    off: 'Off',
    add: 'Add',
    remove: 'Remove',
    layers: 'Layers',
    layerStack: 'Layer Stack',
    visible: 'visible',
    locked: 'locked',
    delete: 'Delete',
    moveUp: 'Move Up',
    moveDown: 'Move Down',
    zIndex: 'z-index',
    presets: 'Presets',
    inspector: 'Inspector',
    noLayerSelected: 'No layer selected',
    baseImageLayer: 'Base wallpaper image layer.',
    count: 'count',
    speed: 'speed',
    opacity: 'opacity',
    projectPackage: 'Project package',
    copySpecJson: 'Copy Spec JSON',
    downloadSpecJson: 'Download wallpaperSpec.json',
    downloadPackage: 'Download wallpaper package',
    preparingPackage: 'Preparing package...',
    packageDownloaded: 'Package downloaded',
    packageExportFailed: 'Package export failed',
    copied: 'Copied',
    emptySpec: 'Upload an image to generate a WallpaperSpec.',
    noSpecFound: 'No wallpaper spec found.',
    background: 'Background',
    glowParticles: 'Glow Particles',
    petals: 'Petals',
    snow: 'Snow',
    rain: 'Rain',
    fireflies: 'Fireflies',
    fog: 'Fog',
    lightRays: 'Light Rays',
    stars: 'Stars',
    glowParticlesDesc: 'Soft drifting light points for a gentle magical layer.',
    petalsDesc: 'Slow falling petal shapes for calm nature motion.',
    snowDesc: 'Light flakes falling across the wallpaper.',
    rainDesc: 'Fast diagonal drops for a rainy ambience.',
    firefliesDesc: 'Warm wandering sparks near the lower scene.',
    fogDesc: 'Wide drifting mist layers for atmospheric depth.',
    lightRaysDesc: 'Soft beams sweeping through the canvas.',
    starsDesc: 'Subtle twinkling points for night scenes.',
  },
  zh: {
    language: 'English',
    theme: '主题',
    camera: '镜头',
    cameraMotion: '镜头运动',
    cameraMode: '模式',
    zoom: '缩放',
    intensity: '强度',
    variant: '样式',
    light: '浅色',
    dark: '深色',
    openPanel: '展开检查器',
    closePanel: '收起检查器',
    showJson: '显示 JSON',
    hideJson: '隐藏 JSON',
    library: '素材库',
    effects: '特效',
    canvas: '画布',
    wallpaperCanvas: '壁纸画布',
    openFullscreenPreview: '打开全屏预览',
    source: '图片源',
    appName: 'AI 壁纸引擎',
    uploadCopy: '导入图片，创建动态壁纸预览。',
    chooseImage: '选择图片',
    imageFormats: '支持 PNG、JPG、GIF 或 WebP',
    enabled: '已启用',
    off: '关闭',
    add: '添加',
    remove: '移除',
    layers: '图层',
    layerStack: '图层栈',
    visible: '可见',
    locked: '锁定',
    delete: '删除',
    moveUp: '上移',
    moveDown: '下移',
    zIndex: '层级',
    presets: '预设',
    inspector: '检查器',
    noLayerSelected: '未选择图层',
    baseImageLayer: '基础壁纸图片图层。',
    count: '数量',
    speed: '速度',
    opacity: '透明度',
    projectPackage: '项目包',
    copySpecJson: '复制 Spec JSON',
    downloadSpecJson: '下载 wallpaperSpec.json',
    downloadPackage: '下载壁纸项目包',
    preparingPackage: '正在准备项目包...',
    packageDownloaded: '项目包已下载',
    packageExportFailed: '项目包导出失败',
    copied: '已复制',
    emptySpec: '上传图片后将生成 WallpaperSpec。',
    noSpecFound: '未找到壁纸 Spec。',
    background: '背景',
    glowParticles: '发光粒子',
    petals: '花瓣',
    snow: '雪',
    rain: '雨',
    fireflies: '萤火虫',
    fog: '雾',
    lightRays: '光束',
    stars: '星空',
    glowParticlesDesc: '柔和漂浮的光点，营造轻盈梦幻感。',
    petalsDesc: '缓慢飘落的花瓣，为画面增加自然动势。',
    snowDesc: '轻雪粒子从画面上方落下。',
    rainDesc: '快速斜向雨线，营造雨天氛围。',
    firefliesDesc: '温暖游动的光点，适合自然和幻想场景。',
    fogDesc: '宽幅漂移雾层，增加空间纵深。',
    lightRaysDesc: '柔和光束扫过画布。',
    starsDesc: '细微闪烁星点，适合夜间场景。',
  },
}

const LANGUAGE_STORAGE_KEY = 'ai-wallpaper-engine.language'

interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
  toggleLanguage: () => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

const getInitialLanguage = (): Language => {
  const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return storedLanguage === 'zh' ? 'zh' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  const value = useMemo<I18nContextValue>(() => {
    const setLanguage = (nextLanguage: Language) => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
      setLanguageState(nextLanguage)
    }

    return {
      language,
      setLanguage,
      t: (key) => TRANSLATIONS[language][key],
      toggleLanguage: () => setLanguage(language === 'en' ? 'zh' : 'en'),
    }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider.')
  }

  return context
}
