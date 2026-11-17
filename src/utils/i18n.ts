export type SupportedLocale = 'pt' | 'en' | 'es' | 'fr' | 'de';

export interface LocaleInfo {
  locale: SupportedLocale;
  country: string;
  source: 'ip' | 'header' | 'manual' | 'default';
}

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

const COUNTRY_TO_LOCALE: Record<string, SupportedLocale> = {
  BR: 'pt',
  PT: 'pt',
  AO: 'pt',
  MZ: 'pt',
  CV: 'pt',
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  CL: 'es',
  PE: 'es',
  VE: 'es',
  UY: 'es',
  EC: 'es',
  FR: 'fr',
  BE: 'fr',
  LU: 'fr',
  MC: 'fr',
  DE: 'de',
  AT: 'de',
  CH: 'de',
  US: 'en',
  GB: 'en',
  CA: 'en',
  AU: 'en',
  NZ: 'en',
  IE: 'en',
  IN: 'en',
};

export function mapCountryToLocale(countryCode: string | null | undefined): SupportedLocale | null {
  if (!countryCode) return null;
  const normalized = countryCode.trim().toUpperCase();
  return COUNTRY_TO_LOCALE[normalized] ?? null;
}

export function resolveLocaleFromAcceptLanguage(headerValue: string | null | undefined): SupportedLocale {
  if (!headerValue) return 'en';
  const parts = headerValue.split(',');
  for (const part of parts) {
    const lang = part.split(';')[0]?.trim().toLowerCase() ?? '';
    const primary = lang.split('-')[0];
    if (primary === 'pt' || primary === 'en' || primary === 'es' || primary === 'fr' || primary === 'de') {
      return primary;
    }
  }
  return 'en';
}

export interface TranslationBundle {
  nav: {
    downloader: string;
    about: string;
    faq: string;
    primaryCta: string;
  };
  workspace: {
    languageLabel: string;
    themeLabel: string;
    themeAuto: string;
    themeLight: string;
    themeDark: string;
    heroTitle: string;
    heroSubtitle: string;
    inputLabel: string;
    inputPlaceholder: string;
    pasteBtn: string;
    clearBtn: string;
    analyzeBtn: string;
    analyzingBtn: string;
    samplesTitle: string;
    sample4k: string;
    sampleMusic: string;
    sampleShort: string;
    errorEmpty: string;
    errorInvalid: string;
    errorFetch: string;
    errorBotCheck: string;
    watermarkFreeLabel: string;
  };
  results: {
    tabVideo: string;
    tabMp3: string;
    qualityCol: string;
    formatCol: string;
    sizeCol: string;
    actionCol: string;
    downloadBtn: string;
    preparingBtn: string;
    saveFileBtn: string;
    readyMessage: string;
    directStreamNote: string;
    maxQualityLabel: string;
    detectedAudioLabel: string;
    nativeAudioTag: string;
    historyTitle: string;
    clearHistory: string;
    noHistory: string;
  };
  ads: {
    sponsoredLabel: string;
    leaderboardTitle: string;
    leaderboardBody: string;
    leaderboardCta: string;
    inFeedTitle: string;
    inFeedBody: string;
    inFeedCta: string;
    companionTitle: string;
    companionBody: string;
    companionCta: string;
  };
  features: {
    aboutTitle: string;
    aboutBody: string;
    stepsTitle: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    faqTitle: string;
    faq1Q: string;
    faq1A: string;
    faq2Q: string;
    faq2A: string;
    faq3Q: string;
    faq3A: string;
    faq4Q: string;
    faq4A: string;
  };
  footer: {
    tagline: string;
    legal: string;
    rights: string;
  };
}

export const TRANSLATIONS: Record<SupportedLocale, TranslationBundle> = {
  pt: {
    nav: {
      downloader: 'Downloader',
      about: 'Sobre',
      faq: 'Dúvidas',
      primaryCta: 'Baixar Agora',
    },
    workspace: {
      languageLabel: 'Idioma',
      themeLabel: 'Tema',
      themeAuto: 'Auto',
      themeLight: 'Claro',
      themeDark: 'Escuro',
      heroTitle: 'Baixe vídeos do YouTube em até 4K sem marca d’água e MP3 em alta velocidade',
      heroSubtitle:
        'Cole qualquer link do YouTube ou Shorts para extrair MP4 Ultra HD (até 2160p) ou áudio MP3 direto no seu celular, tablet ou computador.',
      inputLabel: 'URL do vídeo do YouTube',
      inputPlaceholder: 'Cole aqui o link do YouTube (ex: https://www.youtube.com/watch?v=...)',
      pasteBtn: 'Colar link',
      clearBtn: 'Limpar',
      analyzeBtn: 'Processar Link',
      analyzingBtn: 'Analisando...',
      samplesTitle: 'Testar rápido:',
      sample4k: 'Clipe 4K Remaster',
      sampleMusic: 'Música Oficial',
      sampleShort: 'YouTube Shorts',
      errorEmpty: 'Cole um link do YouTube antes de continuar.',
      errorInvalid: 'URL inválida. Use um link padrão do YouTube, youtu.be ou YouTube Shorts.',
      errorFetch: 'Não foi possível obter os formatos deste vídeo no momento. Tente outro link.',
      errorBotCheck: 'O YouTube solicitou verificação antibot para o IP do servidor neste vídeo. Tente outro link público.',
      watermarkFreeLabel: 'Sem marca d’água',
    },
    results: {
      tabVideo: 'Vídeo MP4',
      tabMp3: 'Áudio MP3 / Original',
      qualityCol: 'Resolução / Taxa',
      formatCol: 'Codec & Formato',
      sizeCol: 'Tamanho Est.',
      actionCol: 'Download',
      downloadBtn: 'Baixar',
      preparingBtn: 'Processando...',
      saveFileBtn: 'Salvar arquivo novamente',
      readyMessage: 'Processamento concluído. O arquivo está pronto.',
      directStreamNote: 'Resolução e áudio detectados automaticamente do vídeo original.',
      maxQualityLabel: 'Máx',
      detectedAudioLabel: 'Áudio',
      nativeAudioTag: 'Original sem perda',
      historyTitle: 'Downloads recentes neste dispositivo',
      clearHistory: 'Limpar histórico',
      noHistory: 'Nenhum download realizado ainda nesta sessão.',
    },
    ads: {
      sponsoredLabel: 'Patrocinado',
      leaderboardTitle: 'Armazenamento em Nuvem Criptografado para Criadores 4K',
      leaderboardBody: 'Salve projetos em 4K e faixas MP3 com sincronização instantânea entre desktop e smartphone.',
      leaderboardCta: 'Conhecer Plano',
      inFeedTitle: 'Editor de Vídeo Online sem Perda de Qualidade',
      inFeedBody: 'Corte trechos, ajuste áudio e exporte seus vídeos MP4 em 60fps direto no navegador.',
      inFeedCta: 'Testar Grátis',
      companionTitle: 'Proteja seu Navegador contra Rastreadores durante Downloads',
      companionBody: 'Navegação rápida e privada compatível com Android, iOS, macOS e Windows.',
      companionCta: 'Ativar Agora',
    },
    features: {
      aboutTitle: 'Sobre o smartvex',
      aboutBody:
        'O smartvex é uma ferramenta web leve para baixar vídeos do YouTube até 4K (2160p) sem marca d’água e extrair áudio MP3 ou M4A original em alta velocidade, com detecção automática de resolução e adaptação completa para celular, tablet e desktop.',
      stepsTitle: 'Como usar em 3 passos',
      step1Title: '01. Cole o link',
      step1Body: 'Compatível com vídeos padrão, YouTube Music e Shorts.',
      step2Title: '02. Escolha MP4 ou MP3',
      step2Body: 'Veja apenas as resoluções e taxas de áudio reais do vídeo.',
      step3Title: '03. Salve no dispositivo',
      step3Body: 'Download direto para a pasta do seu navegador ou celular.',
      faqTitle: 'Perguntas frequentes',
      faq1Q: 'Os vídeos baixados têm marca d’água?',
      faq1A: 'Não. Todos os arquivos MP4 entregues mantêm o quadro original limpo e sem marca d’água.',
      faq2Q: 'Por que alguns vídeos não mostram a opção 4K?',
      faq2A: 'O smartvex detecta automaticamente a resolução máxima real enviada ao YouTube — se o vídeo for 1080p, exibirá apenas até 1080p.',
      faq3Q: 'Funciona em celulares Android, iPhone e tablets?',
      faq3A: 'Sim. Toda a interface é responsiva, com suporte automático ao modo escuro e detecção regional de idioma.',
      faq4Q: 'Qual formato de áudio está disponível?',
      faq4A: 'Você pode baixar o áudio original sem perda (M4A/AAC) ou converter diretamente para MP3.',
    },
    footer: {
      tagline: 'Conversor rápido de YouTube para 4K MP4 e MP3 sem marca d’água.',
      legal: 'Use apenas para conteúdos públicos, próprios ou com permissão de uso.',
      rights: '© 2026 smartvex. Todos os direitos reservados.',
    },
  },
  en: {
    nav: {
      downloader: 'Downloader',
      about: 'About',
      faq: 'FAQ',
      primaryCta: 'Download Now',
    },
    workspace: {
      languageLabel: 'Language',
      themeLabel: 'Theme',
      themeAuto: 'Auto',
      themeLight: 'Light',
      themeDark: 'Dark',
      heroTitle: 'Download YouTube videos up to 4K watermark-free & high-speed MP3',
      heroSubtitle:
        'Paste any YouTube or Shorts link to save crisp Ultra HD MP4 (up to 2160p) or MP3 audio directly on mobile, tablet, or desktop.',
      inputLabel: 'YouTube video URL',
      inputPlaceholder: 'Paste your YouTube link here (e.g. https://www.youtube.com/watch?v=...)',
      pasteBtn: 'Paste link',
      clearBtn: 'Clear',
      analyzeBtn: 'Fetch Formats',
      analyzingBtn: 'Analyzing...',
      samplesTitle: 'Quick try:',
      sample4k: '4K Remaster Clip',
      sampleMusic: 'Official Music',
      sampleShort: 'YouTube Shorts',
      errorEmpty: 'Please paste a YouTube link before continuing.',
      errorInvalid: 'Invalid URL. Enter a valid YouTube, youtu.be, or Shorts link.',
      errorFetch: 'Could not retrieve formats for this video right now. Try another link.',
      errorBotCheck: 'YouTube requested anti-bot verification on the server IP for this video. Please try another public link.',
      watermarkFreeLabel: 'Watermark-free',
    },
    results: {
      tabVideo: 'MP4 Video',
      tabMp3: 'MP3 / Original Audio',
      qualityCol: 'Resolution / Rate',
      formatCol: 'Codec & Format',
      sizeCol: 'Est. Size',
      actionCol: 'Download',
      downloadBtn: 'Download',
      preparingBtn: 'Processing...',
      saveFileBtn: 'Save file again',
      readyMessage: 'Processing complete. Your file is ready.',
      directStreamNote: 'Video resolutions and audio specs auto-detected from source.',
      maxQualityLabel: 'Max',
      detectedAudioLabel: 'Audio',
      nativeAudioTag: 'Original lossless',
      historyTitle: 'Recent downloads on this device',
      clearHistory: 'Clear history',
      noHistory: 'No downloads completed in this session yet.',
    },
    ads: {
      sponsoredLabel: 'Sponsored',
      leaderboardTitle: 'Encrypted Cloud Vault Built for 4K Video Creators',
      leaderboardBody: 'Back up 4K renders and 320kbps MP3 libraries with instant sync across desktop and mobile.',
      leaderboardCta: 'Explore Plan',
      inFeedTitle: 'Browser Video Trimmer with Lossless 60fps Export',
      inFeedBody: 'Cut clips, normalize audio tracks, and export clean MP4 files directly in your browser.',
      inFeedCta: 'Try Free',
      companionTitle: 'Private Ad-Shield & Tracker Blocker for Fast Downloads',
      companionBody: 'Lightweight protection optimized for Android, iOS, macOS, and Windows browsers.',
      companionCta: 'Learn More',
    },
    features: {
      aboutTitle: 'About smartvex',
      aboutBody:
        'smartvex is a lightweight web tool to download YouTube videos up to 4K (2160p) without watermarks and extract clean MP3 or original M4A audio at high speed, with automatic resolution detection across mobile, tablet, and desktop.',
      stepsTitle: 'How it works in 3 steps',
      step1Title: '01. Paste link',
      step1Body: 'Supports standard videos, YouTube Music, and Shorts.',
      step2Title: '02. Pick MP4 or MP3',
      step2Body: 'Displays only the true resolutions and audio bitrates detected from the source.',
      step3Title: '03. Save to device',
      step3Body: 'Direct browser download to your phone, tablet, or computer.',
      faqTitle: 'Frequently asked questions',
      faq1Q: 'Do downloaded videos contain any watermark?',
      faq1A: 'No. Every MP4 download keeps the original clean frames with zero watermarks.',
      faq2Q: 'Why do some videos not show a 4K option?',
      faq2A: 'smartvex auto-detects the true source resolutions—if a video maxes out at 1080p, only options up to 1080p are shown.',
      faq3Q: 'Is smartvex optimized for smartphones and tablets?',
      faq3A: 'Yes. Every control is responsive with automatic system dark mode and regional language support.',
      faq4Q: 'Which audio formats are available?',
      faq4A: 'You can save lossless original M4A/AAC audio or convert directly to MP3.',
    },
    footer: {
      tagline: 'High-speed YouTube 4K MP4 & MP3 downloader without watermarks.',
      legal: 'Intended only for personal offline access to public or authorized content.',
      rights: '© 2026 smartvex. All rights reserved.',
    },
  },
  es: {
    nav: {
      downloader: 'Descargador',
      about: 'Acerca de',
      faq: 'Ayuda',
      primaryCta: 'Descargar Ahora',
    },
    workspace: {
      languageLabel: 'Idioma',
      themeLabel: 'Tema',
      themeAuto: 'Auto',
      themeLight: 'Claro',
      themeDark: 'Oscuro',
      heroTitle: 'Descarga videos de YouTube hasta 4K sin marca de agua y MP3 ultrarrápido',
      heroSubtitle:
        'Pega cualquier enlace de YouTube o Shorts para guardar MP4 Ultra HD (hasta 2160p) o audio MP3 en tu móvil, tablet o PC.',
      inputLabel: 'Enlace de YouTube',
      inputPlaceholder: 'Pega aquí el enlace de YouTube (ej: https://www.youtube.com/watch?v=...)',
      pasteBtn: 'Pegar enlace',
      clearBtn: 'Limpiar',
      analyzeBtn: 'Analizar Video',
      analyzingBtn: 'Analizando...',
      samplesTitle: 'Prueba rápida:',
      sample4k: 'Clip 4K Remaster',
      sampleMusic: 'Música Oficial',
      sampleShort: 'YouTube Shorts',
      errorEmpty: 'Pega un enlace de YouTube antes de continuar.',
      errorInvalid: 'URL no válida. Usa un enlace válido de YouTube, youtu.be o Shorts.',
      errorFetch: 'No pudimos obtener los formatos de este video ahora. Prueba otro enlace.',
      errorBotCheck: 'YouTube solicitó verificación antibot para la IP del servidor en este video. Prueba otro enlace público.',
      watermarkFreeLabel: 'Sin marca de agua',
    },
    results: {
      tabVideo: 'Video MP4',
      tabMp3: 'Audio MP3 / Original',
      qualityCol: 'Calidad / Tasa',
      formatCol: 'Códec y Formato',
      sizeCol: 'Tamaño Est.',
      actionCol: 'Descargar',
      downloadBtn: 'Descargar',
      preparingBtn: 'Procesando...',
      saveFileBtn: 'Guardar archivo de nuevo',
      readyMessage: 'Conversión lista. Tu archivo está listo.',
      directStreamNote: 'Resoluciones de video y audio detectados automáticamente.',
      maxQualityLabel: 'Máx',
      detectedAudioLabel: 'Audio',
      nativeAudioTag: 'Original sin pérdida',
      historyTitle: 'Descargas recientes en este dispositivo',
      clearHistory: 'Borrar historial',
      noHistory: 'Aún no hay descargas en esta sesión.',
    },
    ads: {
      sponsoredLabel: 'Patrocinado',
      leaderboardTitle: 'Nube Cifrada para Creadores de Video 4K',
      leaderboardBody: 'Guarda tus proyectos 4K y colecciones MP3 sincronizados entre PC y móvil.',
      leaderboardCta: 'Ver Plan',
      inFeedTitle: 'Editor de Video Online sin Pérdida de Calidad',
      inFeedBody: 'Recorta clips y exporta videos MP4 en 60fps directamente desde el navegador.',
      inFeedCta: 'Probar Gratis',
      companionTitle: 'Navegación Privada y Rápida Durante Tus Descargas',
      companionBody: 'Protección ligera compatible con Android, iOS, macOS y Windows.',
      companionCta: 'Descubrir',
    },
    features: {
      aboutTitle: 'Acerca de smartvex',
      aboutBody:
        'smartvex es una herramienta web rápida para descargar videos de YouTube hasta 4K (2160p) sin marcas de agua y extraer audio MP3 o M4A original, con detección automática de resolución para móvil, tablet y escritorio.',
      stepsTitle: 'Cómo funciona en 3 pasos',
      step1Title: '01. Pega el enlace',
      step1Body: 'Compatible con videos estándar, YouTube Music y Shorts.',
      step2Title: '02. Elige MP4 o MP3',
      step2Body: 'Muestra únicamente las resoluciones y tasas de audio reales del video.',
      step3Title: '03. Guarda al instante',
      step3Body: 'Descarga directa a tu teléfono, tablet o computadora.',
      faqTitle: 'Preguntas frecuentes',
      faq1Q: '¿Los videos tienen marca de agua?',
      faq1A: 'No. Todos los MP4 mantienen la imagen original limpia y sin marcas de agua.',
      faq2Q: '¿Por qué algunos videos no muestran opción 4K?',
      faq2A: 'smartvex detecta automáticamente la resolución real; si un video es 1080p, mostrará hasta 1080p.',
      faq3Q: '¿Funciona en teléfonos y tablets?',
      faq3A: 'Sí, con interfaz táctil, modo oscuro automático y detección regional de idioma.',
      faq4Q: '¿Qué formatos de audio incluye?',
      faq4A: 'Audio original sin pérdida (M4A/AAC) o conversión directa a MP3.',
    },
    footer: {
      tagline: 'Descargador rápido de YouTube en 4K MP4 y MP3 sin marcas de agua.',
      legal: 'Uso personal para contenido público o autorizado.',
      rights: '© 2026 smartvex. Todos los derechos reservados.',
    },
  },
  fr: {
    nav: {
      downloader: 'Téléchargeur',
      about: 'À propos',
      faq: 'FAQ',
      primaryCta: 'Télécharger',
    },
    workspace: {
      languageLabel: 'Langue',
      themeLabel: 'Thème',
      themeAuto: 'Auto',
      themeLight: 'Clair',
      themeDark: 'Sombre',
      heroTitle: 'Téléchargez des vidéos YouTube jusqu’en 4K sans filigrane et MP3 rapide',
      heroSubtitle:
        'Collez un lien YouTube ou Shorts pour enregistrer en MP4 Ultra HD (jusqu’à 2160p) ou MP3 sur mobile, tablette ou ordinateur.',
      inputLabel: 'Lien vidéo YouTube',
      inputPlaceholder: 'Collez votre lien YouTube ici (ex : https://www.youtube.com/watch?v=...)',
      pasteBtn: 'Coller',
      clearBtn: 'Effacer',
      analyzeBtn: 'Analyser',
      analyzingBtn: 'Analyse...',
      samplesTitle: 'Essai rapide :',
      sample4k: 'Clip 4K Remaster',
      sampleMusic: 'Musique Officielle',
      sampleShort: 'YouTube Shorts',
      errorEmpty: 'Veuillez coller un lien YouTube avant de continuer.',
      errorInvalid: 'URL invalide. Utilisez un lien YouTube, youtu.be ou Shorts.',
      errorFetch: 'Impossible de récupérer les formats pour cette vidéo. Essayez un autre lien.',
      errorBotCheck: 'YouTube a demandé une vérification anti-bot sur cette IP pour cette vidéo. Essayez un autre lien public.',
      watermarkFreeLabel: 'Sans filigrane',
    },
    results: {
      tabVideo: 'Vidéo MP4',
      tabMp3: 'Audio MP3 / Original',
      qualityCol: 'Résolution / Débit',
      formatCol: 'Codec & Format',
      sizeCol: 'Taille Est.',
      actionCol: 'Télécharger',
      downloadBtn: 'Télécharger',
      preparingBtn: 'Traitement...',
      saveFileBtn: 'Enregistrer à nouveau',
      readyMessage: 'Conversion terminée. Votre fichier est prêt.',
      directStreamNote: 'Résolutions vidéo et audio détectées automatiquement.',
      maxQualityLabel: 'Max',
      detectedAudioLabel: 'Audio',
      nativeAudioTag: 'Original sans perte',
      historyTitle: 'Téléchargements récents sur cet appareil',
      clearHistory: 'Effacer',
      noHistory: 'Aucun téléchargement dans cette session.',
    },
    ads: {
      sponsoredLabel: 'Sponsorisé',
      leaderboardTitle: 'Stockage Cloud Chiffré pour Créateurs 4K',
      leaderboardBody: 'Sauvegardez vos vidéos 4K et fichiers MP3 avec synchronisation instantanée.',
      leaderboardCta: 'Découvrir',
      inFeedTitle: 'Éditeur Vidéo en Ligne sans Perte de Qualité',
      inFeedBody: 'Coupez et exportez vos clips MP4 à 60fps directement dans le navigateur.',
      inFeedCta: 'Essayer',
      companionTitle: 'Protection Rapide et Privée pour Vos Téléchargements',
      companionBody: 'Compatible Android, iOS, macOS et Windows.',
      companionCta: 'En savoir plus',
    },
    features: {
      aboutTitle: 'À propos de smartvex',
      aboutBody:
        'smartvex est un outil web rapide pour télécharger des vidéos YouTube jusqu’en 4K (2160p) sans filigrane et extraire l’audio MP3 ou M4A original, avec détection automatique des formats sur mobile, tablette et ordinateur.',
      stepsTitle: 'Comment ça marche en 3 étapes',
      step1Title: '01. Collez le lien',
      step1Body: 'Compatible vidéos classiques, YouTube Music et Shorts.',
      step2Title: '02. Choisissez MP4 ou MP3',
      step2Body: 'Affiche uniquement les résolutions et débits audio réels du flux.',
      step3Title: '03. Enregistrez directement',
      step3Body: 'Téléchargement direct sur smartphone, tablette ou PC.',
      faqTitle: 'Questions fréquentes',
      faq1Q: 'Y a-t-il un filigrane sur les vidéos ?',
      faq1A: 'Non. Tous les téléchargements MP4 restent propres et sans filigrane.',
      faq2Q: 'Pourquoi la 4K n’apparaît-elle pas toujours ?',
      faq2A: 'smartvex détecte la résolution réelle de la vidéo ; si elle est en 1080p, seule cette résolution maximale est affichée.',
      faq3Q: 'Est-ce compatible mobile et tablette ?',
      faq3A: 'Oui, interface tactile optimisée avec mode sombre automatique.',
      faq4Q: 'Quels formats audio sont disponibles ?',
      faq4A: 'Audio original sans perte (M4A/AAC) ou conversion MP3.',
    },
    footer: {
      tagline: 'Téléchargeur YouTube 4K MP4 & MP3 rapide sans filigrane.',
      legal: 'Destiné uniquement à un usage personnel pour du contenu public ou autorisé.',
      rights: '© 2026 smartvex. Tous droits réservés.',
    },
  },
  de: {
    nav: {
      downloader: 'Downloader',
      about: 'Über uns',
      faq: 'FAQ',
      primaryCta: 'Jetzt Laden',
    },
    workspace: {
      languageLabel: 'Sprache',
      themeLabel: 'Design',
      themeAuto: 'Auto',
      themeLight: 'Hell',
      themeDark: 'Dunkel',
      heroTitle: 'YouTube-Videos bis 4K ohne Wasserzeichen & High-Speed-MP3 laden',
      heroSubtitle:
        'Füge einen beliebigen YouTube- oder Shorts-Link ein und speichere Ultra HD MP4 (bis 2160p) oder MP3 direkt auf Handy, Tablet oder Desktop.',
      inputLabel: 'YouTube-Video-URL',
      inputPlaceholder: 'YouTube-Link hier einfügen (z. B. https://www.youtube.com/watch?v=...)',
      pasteBtn: 'Einfügen',
      clearBtn: 'Leeren',
      analyzeBtn: 'Formate Laden',
      analyzingBtn: 'Analysiere...',
      samplesTitle: 'Schnelltest:',
      sample4k: '4K Remaster Clip',
      sampleMusic: 'Offizielle Musik',
      sampleShort: 'YouTube Shorts',
      errorEmpty: 'Bitte füge zuerst einen YouTube-Link ein.',
      errorInvalid: 'Ungültige URL. Bitte gib einen gültigen YouTube-, youtu.be- oder Shorts-Link ein.',
      errorFetch: 'Formate für dieses Video konnten nicht geladen werden. Bitte anderen Link testen.',
      errorBotCheck: 'YouTube hat eine Anti-Bot-Prüfung für diese Server-IP ausgelöst. Bitte anderen öffentlichen Link testen.',
      watermarkFreeLabel: 'Ohne Wasserzeichen',
    },
    results: {
      tabVideo: 'MP4 Video',
      tabMp3: 'MP3 / Original-Audio',
      qualityCol: 'Auflösung / Rate',
      formatCol: 'Codec & Format',
      sizeCol: 'Gesch. Größe',
      actionCol: 'Download',
      downloadBtn: 'Laden',
      preparingBtn: 'Verarbeite...',
      saveFileBtn: 'Datei erneut speichern',
      readyMessage: 'Fertig. Deine Datei ist bereit.',
      directStreamNote: 'Videoauflösung und Audiospur automatisch aus der Quelle erkannt.',
      maxQualityLabel: 'Max',
      detectedAudioLabel: 'Audio',
      nativeAudioTag: 'Verlustfrei Original',
      historyTitle: 'Letzte Downloads auf diesem Gerät',
      clearHistory: 'Verlauf löschen',
      noHistory: 'Noch keine Downloads in dieser Sitzung.',
    },
    ads: {
      sponsoredLabel: 'Gesponsert',
      leaderboardTitle: 'Verschlüsselter Cloud-Speicher für 4K-Creator',
      leaderboardBody: 'Sichere 4K-Videos und 320kbps-MP3s mit Sofort-Sync zwischen Desktop und Mobilgerät.',
      leaderboardCta: 'Mehr erfahren',
      inFeedTitle: 'Online-Video-Editor ohne Qualitätsverlust',
      inFeedBody: 'Clips schneiden und MP4-Dateien mit 60fps direkt im Browser exportieren.',
      inFeedCta: 'Kostenlos testen',
      companionTitle: 'Privatsphäre-Schutz beim schnellen Medien-Download',
      companionBody: 'Optimiert für Android, iOS, macOS und Windows.',
      companionCta: 'Jetzt ansehen',
    },
    features: {
      aboutTitle: 'Über smartvex',
      aboutBody:
        'smartvex ist ein schlankes Web-Tool zum Herunterladen von YouTube-Videos bis 4K (2160p) ohne Wasserzeichen sowie zur schnellen Extraktion von MP3 oder Original-M4A mit automatischer Format-Erkennung.',
      stepsTitle: 'In 3 Schritten herunterladen',
      step1Title: '01. Link einfügen',
      step1Body: 'Unterstützt Standardvideos, YouTube Music und Shorts.',
      step2Title: '02. MP4 oder MP3 wählen',
      step2Body: 'Zeigt nur die tatsächlich vorhandenen Auflösungen und Audioraten.',
      step3Title: '03. Direkt speichern',
      step3Body: 'Direkter Download auf Smartphone, Tablet oder PC.',
      faqTitle: 'Häufig gestellte Fragen',
      faq1Q: 'Haben die Videos ein Wasserzeichen?',
      faq1A: 'Nein. Alle MP4-Downloads bleiben sauber und ohne Wasserzeichen.',
      faq2Q: 'Warum wird bei manchen Videos kein 4K angezeigt?',
      faq2A: 'smartvex erkennt automatisch die echte Quellauflösung – bei 1080p-Videos wird maximal 1080p angeboten.',
      faq3Q: 'Funktioniert smartvex auf Mobilgeräten?',
      faq3A: 'Ja, optimiert für Touchscreens, Tablets und automatischen Dark Mode.',
      faq4Q: 'Welche Audioformate gibt es?',
      faq4A: 'Verlustfreies Original-Audio (M4A/AAC) oder direkte MP3-Konvertierung.',
    },
    footer: {
      tagline: 'Schneller YouTube 4K MP4 & MP3 Downloader ohne Wasserzeichen.',
      legal: 'Nur für den persönlichen Zugriff auf öffentliche oder autorisierte Inhalte.',
      rights: '© 2026 smartvex. Alle Rechte vorbehalten.',
    },
  },
};
