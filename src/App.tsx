import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react'
import {
  ArrowUpRight,
  Clock3,
  ClipboardList,
  Globe2,
  MapPin,
  Menu,
  Minus,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { SiFacebook, SiGooglemaps, SiTelegram, SiWhatsapp } from 'react-icons/si'
import {
  type Product,
  type ProductCategory,
  type ProductSubcategory,
} from './data/products'
import { defaultSiteContent, type SiteContent } from './data/site-content'
import { translations as staticTranslations, type Language } from './i18n/translations'
import { backendFetch } from './lib/backend'
import AdminPortal from './components/AdminPortal'
import './App.css'

type TranslationKey = keyof typeof staticTranslations.en
type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string
type Inquiry = Record<string, number>
type PageName = 'home' | 'about' | 'catalog' | 'category' | 'latest' | 'reviews' | 'contact' | 'not-found'
type PageRoute = { page: PageName; categoryId?: ProductCategory }

function resolvePageRoute(pathname: string): PageRoute {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/' || path === '/home') return { page: 'home' }
  if (path === '/about') return { page: 'about' }
  if (path === '/catalog') return { page: 'catalog' }
  if (path === '/latest') return { page: 'latest' }
  if (path === '/reviews') return { page: 'reviews' }
  if (path === '/contact') return { page: 'contact' }
  if (path.startsWith('/catalog/')) {
    try {
      return { page: 'category', categoryId: decodeURIComponent(path.slice('/catalog/'.length)) }
    } catch {
      return { page: 'not-found' }
    }
  }
  return { page: 'not-found' }
}

const languages: { code: Language; label: string; name: string }[] = [
  { code: 'ar', label: 'عربي', name: 'العربية' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'fr', label: 'FR', name: 'Français' },
]
const currentYear = new Date().getFullYear()
const getInitialLanguage = (): Language => {
  try {
    const saved = localStorage.getItem('awlad-gamal-language')
    return saved === 'en' || saved === 'fr' || saved === 'ar' ? saved : 'ar'
  } catch {
    return 'ar'
  }
}

function App() {
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent)
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const [inquiry, setInquiry] = useState<Inquiry>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname)
  const [activeSubcategory, setActiveSubcategory] = useState<ProductSubcategory | 'all'>('all')
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const shouldReduceMotion = useReducedMotion()
  const site = siteContent.site
  const products = siteContent.products
  const route = resolvePageRoute(currentPath)
  const currentCategory = route.page === 'category'
    ? siteContent.categories.find((category) => category.id === route.categoryId)
    : undefined
  const copy = siteContent.translations[language]
  const direction = language === 'ar' ? 'rtl' : 'ltr'
  const revealProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.16 },
        transition: { duration: 0.55, ease: 'easeOut' as const },
      }

  const t: Translate = (key, values = {}) =>
    Object.entries(values).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      copy[key],
    )

  const selectedModels = products.filter((product) => inquiry[product.id] !== undefined)
  const selectedCount = selectedModels.length
  const totalUnits = Object.values(inquiry).reduce((sum, quantity) => sum + quantity, 0)
  const filteredProducts = route.page === 'category' && currentCategory
    ? products.filter((product) =>
        product.category === currentCategory.id &&
        (activeSubcategory === 'all' || product.subcategory === activeSubcategory),
      )
    : []
  const activeSubcategories = currentCategory?.subcategories ?? []
  const productCategoryName = (category: ProductCategory) =>
    siteContent.categories.find((item) => item.id === category)?.label[language] ?? ''
  const categoryWhatsAppHref = (category: ProductCategory, subcategory?: ProductSubcategory) => {
    const categoryName = productCategoryName(category)
    const sectionName = siteContent.categories
      .find((item) => item.id === category)
      ?.subcategories.find((item) => item.id === subcategory)?.label[language]
    const message = t('categoryWhatsAppMessage', {
      name: sectionName ? `${categoryName} - ${sectionName}` : categoryName,
    })
    return `${site.whatsappUrl}?text=${encodeURIComponent(message)}`
  }
  const productName = (product: (typeof products)[number]) =>
    product.modelCode ?? t('codeNeedsReview')
  const productInquiryLabel = (product: (typeof products)[number], index: number) =>
    product.modelCode
      ? `${t('modelCodePrefix')}: ${product.modelCode}`
      : t('unverifiedImageLabel', { number: String(index + 1).padStart(2, '0') })
  const pageTitle = currentCategory?.label[language] ??
    (route.page === 'catalog' ? t('catalog')
      : route.page === 'latest' ? t('latest')
        : route.page === 'about' ? t('about')
          : route.page === 'reviews' ? t('navReviews')
            : route.page === 'contact' ? t('contact')
              : route.page === 'home' ? copy.pageTitle : t('pageNotFoundTitle'))

  const navigate = (path: string) => {
    if (path !== window.location.pathname) window.history.pushState({}, '', path)
    setCurrentPath(window.location.pathname)
    setMobileMenuOpen(false)
    setActiveSubcategory('all')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const handleInternalNavigation = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (!(event.target instanceof Element)) return
    const anchor = event.target.closest('a[href]')
    if (!(anchor instanceof HTMLAnchorElement) || anchor.target || anchor.hasAttribute('download')) return
    const url = new URL(anchor.href, window.location.href)
    if (url.origin !== window.location.origin || url.hash) return
    event.preventDefault()
    navigate(`${url.pathname}${url.search}`)
  }

  useEffect(() => {
    const syncPath = () => {
      setCurrentPath(window.location.pathname)
      setActiveSubcategory('all')
    }
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  useEffect(() => {
    let active = true
    backendFetch('/api/site')
      .then(async (response) => {
        if (!response.ok) throw new Error(`تعذر تحميل محتوى الموقع (${response.status}).`)
        return response.json() as Promise<SiteContent | null>
      })
      .then((content) => {
        if (!active || !content) return
        setSiteContent(content)
      })
      .catch((error: unknown) => {
        console.error('Unable to load public site content:', error)
      })
    return () => {
      active = false
    }
  }, [])

  const handleAdminSave = (content: SiteContent) => {
    setSiteContent(content)
    if (route.page === 'category' && !content.categories.some((category) => category.id === route.categoryId)) {
      navigate('/catalog')
      setActiveSubcategory('all')
    } else if (route.page === 'category' && activeSubcategory !== 'all' &&
      !content.categories.find((category) => category.id === route.categoryId)
        ?.subcategories.some((subcategory) => subcategory.id === activeSubcategory)) {
      setActiveSubcategory('all')
    }
    setInquiry((current) => Object.fromEntries(
      Object.entries(current).filter(([id]) => content.products.some((product) => product.id === id)),
    ))
  }

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = direction
    document.title = route.page === 'home' ? copy.pageTitle : `${pageTitle} | ${copy.pageTitle}`
    document.querySelector('meta[name="description"]')?.setAttribute('content', copy.metaDescription)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', copy.metaDescription)
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', language === 'ar' ? 'ar_EG' : language === 'fr' ? 'fr_FR' : 'en_US')
    document.querySelector('meta[property="og:image:alt"]')?.setAttribute('content', copy.heroImageAlt)
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', document.title)
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', copy.metaDescription)
    try {
      localStorage.setItem('awlad-gamal-language', language)
    } catch {
      return
    }
  }, [copy.heroImageAlt, copy.metaDescription, copy.pageTitle, direction, language, pageTitle, route.page])

  useEffect(() => {
    if (!drawerOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      returnFocusRef.current?.focus()
    }
  }, [drawerOpen])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage)
    setMobileMenuOpen(false)
  }

  const openDrawer = () => {
    returnFocusRef.current = document.activeElement as HTMLElement
    setDrawerOpen(true)
  }

  const addProduct = (productId: string) => {
    const index = products.findIndex((product) => product.id === productId)
    if (index < 0) return
    setInquiry((current) => ({ ...current, [productId]: current[productId] ?? 1 }))
    setNotice(t('addedNotice', { name: productInquiryLabel(products[index], index) }))
  }

  const setQuantity = (productId: string, quantity: number) => {
    setInquiry((current) => ({ ...current, [productId]: Math.max(1, Math.floor(quantity) || 1) }))
  }

  const removeProduct = (productId: string) => {
    setInquiry((current) => {
      const updated = { ...current }
      delete updated[productId]
      return updated
    })
  }

  const whatsappHref = () => {
    const lines = selectedModels.map((product) => {
      const index = products.findIndex((item) => item.id === product.id)
      return `- ${productInquiryLabel(product, index)} × ${inquiry[product.id]}\n  ${absoluteProductImageUrl(product)}`
    })
    const message = lines.length
      ? `${t('whatsappMessage')}\n\n${lines.join('\n')}`
      : t('generalWhatsAppMessage')
    return `${site.whatsappUrl}?text=${encodeURIComponent(message)}`
  }

  const shareCartInquiry = () => {
    if (selectedCount > 0 && totalUnits < 12) return
    window.location.assign(whatsappHref())
  }

  const productWhatsAppHref = (product: (typeof products)[number], index: number) => {
    const imageUrl = absoluteProductImageUrl(product)
    const message = `${t('productWhatsAppMessage', { name: productInquiryLabel(product, index) })}\n${imageUrl}`
    return `${site.whatsappUrl}?text=${encodeURIComponent(message)}`
  }

  const absoluteProductImageUrl = (product: Product) =>
    new URL(product.image, window.location.origin).toString()

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') setDrawerOpen(false)
    if (event.key !== 'Tab') return
    const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled)',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/about', label: t('about') },
    { href: '/catalog', label: t('catalog') },
    { href: '/reviews', label: t('navReviews') },
    { href: '/contact', label: t('contact') },
  ]

  return (
    <div className="site-shell" dir={direction} onClick={handleInternalNavigation}>
      <a className="skip-link" href="#main">{language === 'ar' ? 'انتقلي إلى المحتوى' : language === 'fr' ? 'Aller au contenu' : 'Skip to content'}</a>
      <header className="site-header">
        <div className="nav-wrap">
          <a className="brand" href="/" aria-label={t('logoAlt')}>
            <img src={site.brandLogoUrl} width="56" height="56" alt="" />
            <span className="brand-copy"><strong>{site.brandName}</strong><small>{site.brandNameArabic}</small></span>
          </a>
          <nav className={`primary-nav ${mobileMenuOpen ? 'is-open' : ''}`} aria-label={language === 'ar' ? 'التنقل الرئيسي' : language === 'fr' ? 'Navigation principale' : 'Main navigation'}>
            {navLinks.map((link) => <a key={link.href} href={link.href} aria-current={
              currentPath === link.href ||
              (route.page === 'category' && link.href === '/catalog') ? 'page' : undefined
            }>{link.label}</a>)}
            <LanguageSelector language={language} onChange={changeLanguage} />
            <a className="mobile-contact-link" href={site.whatsappUrl} target="_blank" rel="noreferrer" aria-label={t('navWhatsApp')}>
              <SiWhatsapp size={17} aria-hidden="true" /> {t('navWhatsApp')}
            </a>
          </nav>
          <div className="nav-actions">
            <LanguageSelector language={language} onChange={changeLanguage} className="desktop-language" />
            <button className="inquiry-nav" type="button" onClick={openDrawer} aria-label={t('inquiryCartCount', { count: selectedCount })}>
              <ClipboardList size={17} aria-hidden="true" />
              <span>{t('inquiryCart')}</span>
              <b>{selectedCount}</b>
            </button>
            <a className="nav-whatsapp" href={site.whatsappUrl} target="_blank" rel="noreferrer">
              <SiWhatsapp size={17} aria-hidden="true" /> <span>{t('navWhatsApp')}</span>
            </a>
            <button className="menu-toggle" type="button" aria-label={mobileMenuOpen ? t('menuClose') : t('menuOpen')} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
              {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>

      <SocialRail t={t} site={site} />

      <main id="main">
        {route.page === 'home' && <section className="hero-section" id="home">
          <div className="hero-inner page-width home-brand-inner">
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-mark" />{t('heroEyebrow')}</p>
              <h1>{t('heroTitle')}</h1>
              <p className="hero-description">{t('heroDescription')}</p>
              <div className="hero-actions">
                <a className="button button-gold" href="/catalog">{t('exploreCollection')} <ArrowUpRight size={16} aria-hidden="true" /></a>
                <a className="button button-outline" href="/about">{t('about')} <ArrowUpRight size={16} aria-hidden="true" /></a>
              </div>
              <p className="hero-note"><span />{t('heroNote')}</p>
            </div>
            <div className="home-brand-mark">
              <img src={site.brandLogoUrl} alt={t('logoAlt')} />
              <span>{site.brandNameArabic}</span>
              <small>{t('heroFounded')} · {t('heroLocation')}</small>
            </div>
          </div>
          <div className="hero-bottom page-width"><span>{t('heroNote')}</span><span>{t('heroFounded')}</span><span>{t('heroLocation')}</span></div>
        </section>}

        {route.page === 'about' && <section className="about-section page-section-pad" id="about">
          <motion.div className="page-width about-inner" {...revealProps}>
            <div className="about-history">
              <img src={site.brandLogoUrl} alt={t('aboutTitle')} />
            </div>
            <div className="about-copy">
              <p className="eyebrow"><span className="eyebrow-mark" />{t('aboutEyebrow')}</p>
              <h1>{t('aboutTitle')}</h1>
              <p>{t('aboutDescription')}</p>
              <a className="text-link text-link-light" href="/contact">{t('contact')} <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </motion.div>
        </section>}

        {route.page === 'about' && <section className="process-section section-pad">
          <div className="page-width">
            <motion.div className="section-heading centered-heading" {...revealProps}>
              <p className="eyebrow eyebrow-dark"><span className="eyebrow-mark" />{t('processEyebrow')}</p>
              <h2>{t('processTitle')}</h2>
            </motion.div>
            <motion.div className="process-grid" {...revealProps}>
              {[
                { number: '01', title: t('stepOneTitle'), description: t('stepOneDescription') },
                { number: '02', title: t('stepTwoTitle'), description: t('stepTwoDescription') },
                { number: '03', title: t('stepThreeTitle'), description: t('stepThreeDescription') },
              ].map((step) => (
                <article className="process-step" key={step.number}>
                  <span className="step-number">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </motion.div>
          </div>
        </section>}

        {route.page === 'catalog' && <section className="collection-intro section-pad" id="collection">
          <motion.div className="page-width collection-intro-inner" {...revealProps}>
            <div className="collection-intro-main">
              <p className="eyebrow eyebrow-dark"><span className="eyebrow-mark" />{t('collectionEyebrow')}</p>
              <h1>{t('catalogTitle')}</h1>
              <p className="section-description">{t('collectionDescription')}</p>
            </div>
            <div className="intro-side">
              <p className="minimum-order-notice">{t('minimumOrderNotice')}</p>
            </div>
          </motion.div>
          <div className="page-width category-directory">
            {siteContent.categories.map((category) => (
              <a className="category-directory-card" href={`/catalog/${encodeURIComponent(category.id)}`} key={category.id}>
                <span className="category-directory-count">{products.filter((product) => product.category === category.id).length}</span>
                <h3>{category.label[language]}</h3>
                <p>{category.subcategories.map((subcategory) => subcategory.label[language]).join(' · ') || t('modelsAvailable', { count: products.filter((product) => product.category === category.id).length })}</p>
                <span className="category-directory-link">{t('viewCategory')} <ArrowUpRight size={16} aria-hidden="true" /></span>
              </a>
            ))}
          </div>
        </section>}

        {route.page === 'latest' && <section className="collection-intro section-pad" id="latest">
          <div className="page-width collection-intro-inner">
            <div className="collection-intro-main">
              <p className="eyebrow eyebrow-dark"><span className="eyebrow-mark" />{t('catalogEyebrow')}</p>
              <h1>{t('latest')}</h1>
              <p className="section-description">{t('catalogDescription')}</p>
            </div>
            <div className="intro-side">
              <a className="button button-gold" href="/catalog">{t('catalog')} <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
          <div className="page-width category-directory">
            {siteContent.categories.map((category) => (
              <a className="category-directory-card" href={`/catalog/${encodeURIComponent(category.id)}`} key={category.id}>
                <span className="category-directory-count">{products.filter((product) => product.category === category.id).length}</span>
                <h3>{category.label[language]}</h3>
                <p>{category.subcategories.map((subcategory) => subcategory.label[language]).join(' · ') || t('modelsAvailable', { count: products.filter((product) => product.category === category.id).length })}</p>
                <span className="category-directory-link">{t('viewCategory')} <ArrowUpRight size={16} aria-hidden="true" /></span>
              </a>
            ))}
          </div>
        </section>}

        {route.page === 'category' && currentCategory && <>
          <section className="collection-intro section-pad category-page-intro">
            <div className="page-width collection-intro-inner">
              <div className="collection-intro-main">
                <a className="text-link category-back-link" href="/catalog">{t('catalog')} <ArrowUpRight size={16} aria-hidden="true" /></a>
                <p className="eyebrow eyebrow-dark"><span className="eyebrow-mark" />{t('collectionEyebrow')}</p>
                <h1>{currentCategory.label[language]}</h1>
                {currentCategory.subcategories.length > 0 && <div className="subcategory-links" role="group" aria-label={t('subcategoryAll')}>
                  <button className="subcategory-chip" type="button" aria-pressed={activeSubcategory === 'all'} onClick={() => setActiveSubcategory('all')}>
                    {t('subcategoryAll')} <span>{products.filter((product) => product.category === currentCategory.id).length}</span>
                  </button>
                  {activeSubcategories.map((subcategory) => (
                    <button className="subcategory-chip" type="button" key={subcategory.id} aria-pressed={activeSubcategory === subcategory.id} onClick={() => setActiveSubcategory(subcategory.id)}>
                      {subcategory.label[language]}
                      <span>{products.filter((product) => product.category === currentCategory.id && product.subcategory === subcategory.id).length}</span>
                    </button>
                  ))}
                </div>}
              </div>
              <div className="intro-side category-page-actions">
                <p>{t('minimumOrderNotice')}</p>
                <a className="category-whatsapp-link" href={categoryWhatsAppHref(currentCategory.id, activeSubcategory === 'all' ? undefined : activeSubcategory)} target="_blank" rel="noreferrer">
                  <SiWhatsapp size={17} aria-hidden="true" />{t('categoryWhatsAppCta')}
                </a>
              </div>
            </div>
          </section>

        <section className="catalog-section" id="latest">
          <div className="page-width">
            <motion.div className="catalog-heading" {...revealProps}>
              <div>
                <p className="eyebrow eyebrow-dark"><span className="eyebrow-mark" />{t('catalogEyebrow')}</p>
                <h2>{currentCategory.label[language]}</h2>
                <p className="section-description">{t('catalogDescription')}</p>
              </div>
              <span className="catalog-count">{t('modelsAvailable', { count: filteredProducts.length })}</span>
            </motion.div>
            <div className="product-grid">
              {filteredProducts.length === 0 && <p className="catalog-empty">{t('emptyCategoryModels')}</p>}
              {filteredProducts.map((product) => {
                const index = products.findIndex((item) => item.id === product.id)
                const name = productName(product)
                const isAdded = inquiry[product.id] !== undefined
                return (
                  <article className="product-card" key={product.id}>
                    <div className="product-image-wrap">
                      <img src={product.image} alt={t('productAlt', { name: productInquiryLabel(product, index) })} width={product.width} height={product.height} loading="lazy" />
                    </div>
                    <div className="product-info">
                      <div><p className="product-kicker">{product.modelCode ? t('modelCodePrefix') : t('unverifiedImageLabel', { number: String(index + 1).padStart(2, '0') })}</p><h3>{name}</h3></div>
                      <button className={`add-button ${isAdded ? 'is-added' : ''}`} type="button" onClick={() => addProduct(product.id)} aria-label={`${isAdded ? t('added') : t('addInquiry')} — ${name}`} aria-pressed={isAdded}>
                        {isAdded ? <span aria-hidden="true">✓</span> : <Plus size={17} aria-hidden="true" />}
                      </button>
                    </div>
                    <a className="product-cta" href={productWhatsAppHref(product, index)} target="_blank" rel="noreferrer">
                      <SiWhatsapp size={17} aria-hidden="true" /><span>{t('askModelWhatsApp')}</span><ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
        </>}

        {route.page === 'reviews' && <section className="reviews-section section-pad" id="reviews">
          <div className="page-width">
            <motion.div className="reviews-heading" {...revealProps}>
              <div>
                <p className="eyebrow eyebrow-dark"><span className="eyebrow-mark" />{t('reviewsEyebrow')}</p>
                <h1>{t('reviewsTitle')}</h1>
                <p className="section-description">{t('reviewsDescription')}</p>
              </div>
              <div className="rating-summary" aria-label={t('googleRatingSummary')}>
                <span className="rating-score">5.0</span>
                <span className="rating-stars" aria-hidden="true">★★★★★</span>
                <span className="rating-count">{t('googleReviewsCount')}</span>
                <span className="rating-source">{t('googleRatingChecked')}</span>
              </div>
            </motion.div>
            <motion.div className="reviews-grid" {...revealProps}>
              {[
                { author: t('reviewAuthorOne'), quote: t('reviewQuoteOne') },
                { author: t('reviewAuthorTwo'), quote: t('reviewQuoteTwo') },
              ].map((review) => (
                <article className="review-card" key={review.author}>
                  <div className="review-card-top">
                    <span className="rating-stars" aria-label={t('fiveStarReview')}>★★★★★</span>
                    <span className="review-source"><Star size={13} aria-hidden="true" /> Google</span>
                  </div>
                  <blockquote>{review.quote}</blockquote>
                  <p className="review-author">{review.author}</p>
                </article>
              ))}
            </motion.div>
            <a className="text-link reviews-link" href={site.googleMapsUrl} target="_blank" rel="noreferrer">
              {t('viewGoogleReviews')} <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            {siteContent.reviewVideos.length > 0 && (
              <div className="customer-videos">
                <div className="customer-videos-heading">
                  <h3>{t('customerVideosTitle')}</h3>
                  <p>{t('customerVideosDescription')}</p>
                </div>
                <div className="customer-videos-grid">
                  {siteContent.reviewVideos.map((videoUrl, index) => {
                    const embedUrl = new URL('https://www.facebook.com/plugins/video.php')
                    embedUrl.searchParams.set('href', videoUrl)
                    embedUrl.searchParams.set('show_text', 'false')
                    embedUrl.searchParams.set('width', '500')
                    return (
                      <article className="customer-video-card" key={videoUrl}>
                        <iframe
                          src={embedUrl.toString()}
                          title={t('customerVideoLabel', { number: index + 1 })}
                          loading="lazy"
                          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      </article>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>}

        {route.page === 'contact' && <section className="contact-section section-pad" id="contact">
          <div className="page-width">
            <motion.div className="contact-heading" {...revealProps}>
              <div>
                <p className="eyebrow eyebrow-dark"><span className="eyebrow-mark" />{t('contactEyebrow')}</p>
                <h1>{t('contactTitle')}</h1>
              </div>
              <p>{t('contactDescription')}</p>
            </motion.div>
            <motion.div className="business-facts" aria-label={t('businessInfoLabel')} {...revealProps}>
              <div className="business-fact">
                <span className="contact-icon"><Globe2 size={20} aria-hidden="true" /></span>
                <span className="business-fact-copy"><strong>{t('shippingLabel')}</strong><small>{t('shippingWorldwide')}</small></span>
              </div>
              <div className="business-fact">
                <span className="contact-icon"><Clock3 size={20} aria-hidden="true" /></span>
                <span className="business-fact-copy"><strong>{t('officeHoursLabel')}</strong><small>{t('officeHoursValue')}</small></span>
              </div>
            </motion.div>
            <motion.div className="contact-grid" {...revealProps}>
              <a className="contact-card contact-card-primary contact-card-whatsapp" href={site.whatsappUrl} target="_blank" rel="noreferrer">
                <span className="contact-icon"><SiWhatsapp size={20} aria-hidden="true" /></span><span className="contact-card-copy"><strong>{t('whatsappContact')}</strong><small>{site.whatsappDisplayNumber}</small></span><ArrowUpRight size={17} aria-hidden="true" />
              </a>
              <a className="contact-card contact-card-whatsapp contact-card-whatsapp-group" href={site.whatsappGroupUrl} target="_blank" rel="noreferrer">
                <span className="contact-icon"><SiWhatsapp size={20} aria-hidden="true" /></span><span className="contact-card-copy"><strong>{t('whatsappGroupContact')}</strong><small>{t('whatsappGroupDetail')}</small></span><ArrowUpRight size={17} aria-hidden="true" />
              </a>
              <a className="contact-card" href={site.facebookUrl} target="_blank" rel="noreferrer">
                <span className="contact-icon facebook-brand-icon"><SiFacebook size={20} aria-hidden="true" /></span><span className="contact-card-copy"><strong>{t('facebookContact')}</strong><small>{t('facebookDetail')}</small></span><ArrowUpRight size={17} aria-hidden="true" />
              </a>
              <a className="contact-card" href={site.telegramUrl} target="_blank" rel="noreferrer">
                <span className="contact-icon telegram-brand-icon"><SiTelegram size={20} aria-hidden="true" /></span><span className="contact-card-copy"><strong>{t('telegramContact')}</strong><small>{t('telegramDetail')}</small></span><ArrowUpRight size={17} aria-hidden="true" />
              </a>
              <div className="contact-card address-card">
                <span className="contact-icon"><MapPin size={20} aria-hidden="true" /></span><span className="contact-card-copy"><strong>{t('officeAddress')}</strong><small>{language === 'ar' ? site.addressArabic : language === 'fr' ? site.addressFrench : site.addressEnglish}</small><span className="map-link">{t('mapsButton')} <ArrowUpRight size={14} aria-hidden="true" /></span></span>
                <a className="address-link" href={site.googleMapsUrl} target="_blank" rel="noreferrer" aria-label={t('mapsButton')} />
              </div>
            </motion.div>
          </div>
        </section>}

        {route.page === 'contact' && <section className="final-cta">
          <motion.div className="page-width final-cta-inner" {...revealProps}>
            <div><p className="eyebrow"><span className="eyebrow-mark" />{t('heroEyebrow')}</p><h2>{t('finalTitle')}</h2><p>{t('finalDescription')}</p></div>
            <a className="button button-whatsapp" href={site.whatsappUrl} target="_blank" rel="noreferrer"><SiWhatsapp size={19} aria-hidden="true" />{t('finalButton')} <ArrowUpRight size={16} aria-hidden="true" /></a>
          </motion.div>
        </section>}

        {route.page === 'not-found' || route.page === 'category' && !currentCategory
          ? <section className="page-not-found page-width">
              <p className="eyebrow eyebrow-dark"><span className="eyebrow-mark" />{t('pageNotFoundEyebrow')}</p>
              <h1>{t('pageNotFoundTitle')}</h1>
              <p>{t('pageNotFoundDescription')}</p>
              <a className="button button-gold" href="/">{t('home')} <ArrowUpRight size={16} aria-hidden="true" /></a>
            </section>
          : null}
      </main>

      <footer className="site-footer">
        <motion.div className="page-width footer-main" {...revealProps}>
          <div className="footer-brand-block">
            <a className="brand footer-brand" href="/"><img src={site.brandLogoUrl} width="54" height="54" alt={t('logoAlt')} loading="lazy" /><span className="brand-copy"><strong>{site.brandName}</strong><small>{site.brandNameArabic}</small></span></a>
            <p>{t('footerAddress')}</p>
          </div>
          <div className="footer-column"><h3>{t('footerNavigate')}</h3>{navLinks.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}</div>
          <div className="footer-column"><h3>{t('footerContact')}</h3><a className="footer-whatsapp-link" href={site.whatsappUrl} target="_blank" rel="noreferrer"><SiWhatsapp size={15} aria-hidden="true" />{t('whatsappContact')}</a><a className="footer-whatsapp-link" href={site.whatsappGroupUrl} target="_blank" rel="noreferrer"><SiWhatsapp size={15} aria-hidden="true" />{t('whatsappGroupContact')}</a><a href={site.facebookUrl} target="_blank" rel="noreferrer">{t('facebookContact')}</a><a href={site.telegramUrl} target="_blank" rel="noreferrer">{t('telegramContact')}</a><a href={site.googleMapsUrl} target="_blank" rel="noreferrer">{t('mapsButton')}</a></div>
        </motion.div>
        <div className="page-width footer-bottom"><span>© {currentYear} {site.brandName}. {t('copyright')}</span><span>{t('footerLocation')}</span></div>
      </footer>

      <AdminPortal siteContent={siteContent} onSaved={handleAdminSave} />

      {notice && <div className="toast" role="status" aria-live="polite">{notice}</div>}

      {drawerOpen && <div className="drawer-layer">
        <button className="drawer-scrim" type="button" aria-label={language === 'ar' ? 'إغلاق قائمة الاستفسار' : language === 'fr' ? 'Fermer la demande' : 'Close inquiry'} onClick={() => setDrawerOpen(false)} />
        <aside className="inquiry-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" onKeyDown={handleDialogKeyDown}>
          <div className="drawer-header"><div><p className="eyebrow eyebrow-dark"><span className="eyebrow-mark" />{t('inquiryCart')}</p><h2 id="drawer-title">{t('drawerTitle')}</h2></div><button ref={closeButtonRef} className="icon-button" type="button" onClick={() => setDrawerOpen(false)} aria-label={t('menuClose')}><X size={20} /></button></div>
          <p className="drawer-description">{t('drawerDescription')}</p>
          {selectedModels.length === 0 ?           <div className="drawer-empty"><ClipboardList size={28} aria-hidden="true" /><p>{t('emptyInquiry')}</p><button className="text-link" type="button" onClick={() => { setDrawerOpen(false); document.querySelector('#latest')?.scrollIntoView({ behavior: 'smooth' }) }}>{t('browseModels')} <ArrowUpRight size={15} /></button></div> : <>
            <div className="inquiry-items">
              {selectedModels.map((product) => {
                const index = products.findIndex((item) => item.id === product.id)
                const name = productInquiryLabel(product, index)
                const quantity = inquiry[product.id]
                return <article className="inquiry-item" key={product.id}>
                  <img src={product.image} alt="" width="60" height="80" loading="lazy" />
                  <div className="inquiry-item-copy"><h3>{name}</h3><span>{t('quantityLabel')}</span><div className="quantity-control"><button type="button" aria-label={t('decreaseQuantity', { name })} onClick={() => quantity > 1 ? setQuantity(product.id, quantity - 1) : setNotice(t('quantityMinimum'))} disabled={quantity <= 1}><Minus size={14} /></button><output aria-live="polite">{quantity}</output><button type="button" aria-label={t('increaseQuantity', { name })} onClick={() => setQuantity(product.id, quantity + 1)}><Plus size={14} /></button></div></div>
                  <button className="remove-button" type="button" aria-label={t('removeModel', { name })} onClick={() => removeProduct(product.id)}><Trash2 size={17} /></button>
                </article>
              })}
            </div>
            <div className="drawer-summary"><span>{t('totalUnits')}</span><strong>{totalUnits}</strong></div>
            {totalUnits < 12 && <p className="drawer-minimum-hint" role="status">{t('minimumOrderHint')}</p>}
            <button className="clear-button" type="button" onClick={() => setInquiry({})} disabled={!selectedCount}>{t('clearInquiry')}</button>
          </>}
          <div className="drawer-footer"><button className="button button-whatsapp drawer-send" type="button" onClick={shareCartInquiry} disabled={selectedCount > 0 && totalUnits < 12}><SiWhatsapp size={19} aria-hidden="true" />{selectedCount ? t('sendInquiry') : t('generalInquiry')}</button></div>
        </aside>
      </div>}
    </div>
  )
}

function LanguageSelector({ language, onChange, className = '' }: { language: Language; onChange: (language: Language) => void; className?: string }) {
  return <div className={`language-selector ${className}`} role="group" aria-label={language === 'ar' ? 'اختاري اللغة' : language === 'fr' ? 'Choisir la langue' : 'Choose language'}>
    {languages.map((item) => <button key={item.code} type="button" lang={item.code} aria-label={item.name} aria-pressed={language === item.code} onClick={() => onChange(item.code)}>{item.label}</button>)}
  </div>
}

function SocialRail({ t, site }: { t: Translate; site: SiteContent['site'] }) {
  const links = [
    { href: site.facebookUrl, label: t('facebookContact'), shortLabel: t('railFacebook'), Icon: SiFacebook, platform: 'facebook' },
    { href: site.telegramUrl, label: t('telegramContact'), shortLabel: t('railTelegram'), Icon: SiTelegram, platform: 'telegram' },
    { href: site.whatsappGroupUrl, label: t('whatsappGroupContact'), shortLabel: t('railWhatsAppGroup'), Icon: SiWhatsapp, platform: 'whatsapp' },
    { href: site.googleMapsUrl, label: t('mapsButton'), shortLabel: t('railMaps'), Icon: SiGooglemaps, platform: 'maps' },
  ]

  return (
    <nav className="social-rail" aria-label={t('socialLinksLabel')}>
      {links.map(({ href, label, shortLabel, Icon, platform }) => (
        <a className={`social-rail-link social-rail-${platform}`} href={href} key={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
          <Icon size={19} aria-hidden="true" />
          <span className="social-rail-label">{shortLabel}</span>
        </a>
      ))}
    </nav>
  )
}

export default App
