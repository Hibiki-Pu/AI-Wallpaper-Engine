import type { MockImageAnalysis } from './smartMatchTypes'

const unique = (items: string[]) => [...new Set(items)]

export async function mockImageAnalyzer(
  imageUrl: string,
  fileName = '',
): Promise<MockImageAnalysis> {
  const sourceText = `${fileName} ${decodeURIComponent(imageUrl)}`
    .toLowerCase()
    .replace(/[_-]+/g, ' ')

  const detectedTags: string[] = []
  const detectedMood: string[] = []
  const detectedColors: string[] = []

  if (/(night|moon|star|sky|space)/.test(sourceText)) {
    detectedTags.push('night')
    detectedMood.push('calm', 'dream')
    detectedColors.push('blue', 'dark')
  }

  if (/(snow|winter|ice|frost)/.test(sourceText)) {
    detectedTags.push('snow', 'winter')
    detectedMood.push('quiet')
    detectedColors.push('white', 'blue')
  }

  if (/(rain|rainy|storm|wet)/.test(sourceText)) {
    detectedTags.push('rain')
    detectedMood.push('moody')
    detectedColors.push('blue', 'neon')
  }

  if (/(flower|sakura|spring|cherry|garden)/.test(sourceText)) {
    detectedTags.push('spring', 'sakura', 'flowers')
    detectedMood.push('romantic', 'soft')
    detectedColors.push('pink', 'warm')
  }

  if (/(forest|tree|nature|green|moss)/.test(sourceText)) {
    detectedTags.push('forest', 'nature')
    detectedMood.push('magic', 'fresh')
    detectedColors.push('green')
  }

  if (/(ocean|sea|sunset|beach|coast)/.test(sourceText)) {
    detectedTags.push('ocean', 'sunset')
    detectedMood.push('warm', 'cinematic')
    detectedColors.push('orange', 'warm')
  }

  if (/(cyber|neon|city|street)/.test(sourceText)) {
    detectedTags.push('cyberpunk', 'city')
    detectedMood.push('futuristic')
    detectedColors.push('neon', 'blue')
  }

  const tags = unique(detectedTags)
  const mood = unique(detectedMood)
  const colors = unique(detectedColors)

  return {
    detectedTags: tags.length > 0 ? tags : ['dream'],
    detectedMood: mood.length > 0 ? mood : ['balanced'],
    detectedColors: colors.length > 0 ? colors : ['blue'],
    summary:
      tags.length > 0
        ? `Mock analysis detected ${tags.join(', ')} cues from the image name.`
        : 'Mock analysis found no strong filename cues, so it recommends versatile dreamy styles.',
  }
}
