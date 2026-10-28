import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  ArrowDown,
  ArrowUpRight,
  Clock3,
  ClipboardList,
  Globe2,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { SiFacebook, SiGooglemaps, SiTelegram, SiWhatsapp } from 'react-icons/si'
import { site } from './config/site'
import { products } from './data/products'
import { translations, type Language } from './i18n/translations'
import './App.css'

type TranslationKey = keyof typeof translations.en
type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string
type Inquiry = Record<string, number>

const languages: { code: Language; label: string; name: string }[] = [
  { code: 'ar', label: 'عربي', name: 'العربية' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'fr', label: 'FR', name: 'Français' },
]
const currentYear = new Date().getFullYear()
const categoryKeys: TranslationKey[] = [
  'categoryAbayas',
  'categoryHomewear',
  'categoryLingerie',
  'categoryDresses',
  'categoryOther',
]

const getInitialLanguage = (): Language => {
  try {
    const saved = localStorage.getItem('awlad-gamal-language')
    return saved === 'en' || saved === 'fr' || saved === 'ar' ? saved : 'ar'
  } catch {
    return 'ar'
  }
}

function App() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const [inquiry, setInquiry] = useState<Inquiry>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const copy = translations[language]
  const direction = language === 'ar' ? 'rtl' : 'ltr'

  const t: Translate = (key, values = {}) =>
    Object.entries(values).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      copy[key],
    )

  const selectedModels = products.filter((product) => inquiry[product.id] !== undefined)
  const selectedCount = selectedModels.length
  const totalUnits = Object.values(inquiry).reduce((sum, quantity) => sum + quantity, 0)
  const heroProducts = ['201', '200', '199', '202'].flatMap((code) =>
    products.filter((product) => product.modelCode === code),
  )
  const productName = (product: (typeof products)[number]) =>
    product.modelCode ?? t('codeNeedsReview')
  const productInquiryLabel = (product: (typeof products)[number], index: number) =>
    product.modelCode
      ? `${t('modelCodePrefix')}: ${product.modelCode}`
      : t('unverifiedImageLabel', { number: String(index + 1).padStart(2, '0') })
  const categoryWhatsAppHref = (category: string) =>
    `${site.whatsappUrl}?text=${encodeURIComponent(t('categoryInquiryMessage', { category }))}`

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = direction
    document.title = copy.pageTitle
    document.querySelector('meta[name="description"]')?.setAttribute('content', copy.metaDescription)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', copy.pageTitle)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', copy.metaDescription)
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', language === 'ar' ? 'ar_EG' : language === 'fr' ? 'fr_FR' : 'en_US')
    document.querySelector('meta[property="og:image:alt"]')?.setAttribute('content', copy.heroImageAlt)
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', copy.pageTitle)
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', copy.metaDescription)
    try {
      localStorage.setItem('awlad-gamal-language', language)
    } catch {
      return
    }
  }, [copy.heroImageAlt, copy.metaDescription, copy.pageTitle, direction, language])

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
      return `- ${productInquiryLabel(product, index)} × ${inquiry[product.id]}`
    })
    const message = lines.length
      ? `${t('whatsappMessage')}\n\n${lines.join('\n')}`
      : t('generalWhatsAppMessage')
    return `${site.whatsappUrl}?text=${encodeURIComponent(message)}`
  }

  const productWhatsAppHref = (product: (typeof products)[number], index: number) => {
    const message = t('productWhatsAppMessage', { name: productInquiryLabel(product, index) })
    return `${site.whatsappUrl}?text=${encodeURIComponent(message)}`
  }

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
    { href: '#home', label: t('home') },
    { href: '#collection', label: t('collection') },
    { href: '#latest', label: t('latest') },
    { href: '#about', label: t('about') },
    { href: '#contact', label: t('contact') },
  ]

  return (
    <div className="site-shell" dir={direction}>
      <a className="skip-link" href="#main">{language === 'ar' ? 'انتقلي إلى المحتوى' : language === 'fr' ? 'Aller au contenu' : 'Skip to content'}</a>
      <header className="site-header">
        <div className="nav-wrap">
          <a className="brand" href="#home" aria-label={t('logoAlt')}>
            <img src="/assets/brand/awlad-gamal-logo-transparent.webp" width="56" height="56" alt="" />
            <span className="brand-copy"><strong>{site.brandName}</strong><small>{site.brandNameArabic}</small></span>
          </a>
          <nav className={`primary-nav ${mobileMenuOpen ? 'is-open' : ''}`} aria-label={language === 'ar' ? 'التنقل الرئيسي' : language === 'fr' ? 'Navigation principale' : 'Main navigation'}>
            {navLinks.map((link) => <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>{link.label}</a>)}
            <LanguageSelector language={language} onChange={changeLanguage} />
            <a className="mobile-contact-link" href={site.whatsappUrl} target="_blank" rel="noreferrer" aria-label={t('navWhatsApp')}>
              <MessageCircle size={16} aria-hidden="true" /> {t('navWhatsApp')}
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
              <MessageCircle size={16} aria-hidden="true" /> <span>{t('navWhatsApp')}</span>
            </a>
            <button className="menu-toggle" type="button" aria-label={mobileMenuOpen ? t('menuClose') : t('menuOpen')} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
              {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>

      <SocialRail t={t} />

      <main id="main">
        <section className="hero-section" id="home">
          <div className="hero-inner page-width">
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-mark" />{t('heroEyebrow')}</p>
              <h1>{t('heroTitle')}</h1>
              <p className="hero-description">{t('heroDescription')}</p>
              <div className="hero-actions">
                <a className="button button-gold" href="#collection">{t('exploreCollection')} <ArrowDown size={16} aria-hidden="true" /></a>
                <a className="button button-outline" href={site.whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={17} aria-hidden="true" />{t('inquireWhatsApp')}</a>
              </div>
              <p className="hero-note"><span />{t('heroNote')}</p>
            </div>
            <div className="hero-visual">
              <div className="hero-image-frame" role="img" aria-label={t('heroImageAlt')}>
                <div className="hero-composition-orbit" aria-hidden="true" />
                {heroProducts.map((product, index) => (
                  <img
                    className={`hero-model hero-model-${index + 1}`}
                    key={product.id}
                    src={product.image}
                    alt=""
                    width={product.width}
                    height={product.height}
                    fetchPriority={index === 0 ? 'high' : undefined}
                  />
                ))}
                <span className="hero-model-code" dir="ltr">
                  {t('heroFeaturedModel', { code: heroProducts[0].modelCode ?? '' })}
                </span>
              </div>
              <div className="hero-caption"><span>{t('heroSideNote')}</span><span>{t('heroModelsCaption')}</span></div>
            </div>
          </div>
          <div className="hero-bottom page-width"><span>{t('heroNote')}</span><span>{t('heroFounded')}</span><span>{t('heroLocation')}</span></div>
        </section>

        <section className="collection-intro section-pad" id="collection">
          <div className="page-width collection-intro-inner">
            <div className="collection-intro-main">
              <p className="eyebrow eyebrow-dark"><span className="eyebrow-mark" />{t('collectionEyebrow')}</p>
              <h2>{t('collectionTitle')}</h2>
              <div className="category-list" aria-label={t('categoriesLabel')}>
                <span className="category-list-label">{t('categoriesLabel')}</span>
                <div className="category-links">
                  {categoryKeys.map((key) => (
                    <a className="category-chip" href={categoryWhatsAppHref(t(key))} key={key} target="_blank" rel="noreferrer">
                      {t(key)} <ArrowUpRight size={13} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="intro-side">
              <p>{t('collectionDescription')}</p>
              <a className="text-link" href="#latest">{t('latest')} <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <section className="catalog-section" id="latest">
          <div className="page-width">
            <div className="catalog-heading">
              <div>
                <p className="eyebrow eyebrow-dark"><span className="eyebrow-mark" />{t('catalogEyebrow')}</p>
                <h2>{t('catalogTitle')}</h2>
                <p className="section-description">{t('catalogDescription')}</p>
              </div>
              <span className="catalog-count">{t('modelsAvailable', { count: products.length })}</span>
            </div>
            <div className="product-grid">
              {products.map((product, index) => {
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
                      <span>{t('askModelWhatsApp')}</span><ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="process-section section-pad">
          <div className="page-width">
            <div className="section-heading centered-heading">
              <p className="eyebrow eyebrow-dark"><span className="eyebrow-mark" />{t('processEyebrow')}</p>
              <h2>{t('processTitle')}</h2>
            </div>
            <div className="process-grid">
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
            </div>
          </div>
        </section>

        <section className="reviews-section section-pad" id="reviews">
          <div className="page-width">
            <div className="reviews-heading">
              <div>
                <p className="eyebrow eyebrow-dark"><span className="eyebrow-mark" />{t('reviewsEyebrow')}</p>
                <h2>{t('reviewsTitle')}</h2>
                <p className="section-description">{t('reviewsDescription')}</p>
              </div>
              <div className="rating-summary" aria-label={t('googleRatingSummary')}>
                <span className="rating-score">5.0</span>
                <span className="rating-stars" aria-hidden="true">★★★★★</span>
                <span className="rating-count">{t('googleReviewsCount')}</span>
                <span className="rating-source">{t('googleRatingChecked')}</span>
              </div>
            </div>
            <div className="reviews-grid">
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
            </div>
            <a className="text-link reviews-link" href={site.googleMapsUrl} target="_blank" rel="noreferrer">
              {t('viewGoogleReviews')} <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="page-width about-inner">
            <div className="about-history" aria-label={t('aboutEyebrow')}>
              <span>{t('aboutEyebrow')}</span>
              <strong dir="ltr">2016</strong>
            </div>
            <div className="about-copy">
              <p className="eyebrow"><span className="eyebrow-mark" />{t('aboutEyebrow')}</p>
              <h2>{t('aboutTitle')}</h2>
              <p>{t('aboutDescription')}</p>
              <a className="text-link text-link-light" href="#contact">{t('contact')} <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <section className="contact-section section-pad" id="contact">
          <div className="page-width">
            <div className="contact-heading">
              <div>
                <p className="eyebrow eyebrow-dark"><span className="eyebrow-mark" />{t('contactEyebrow')}</p>
                <h2>{t('contactTitle')}</h2>
              </div>
              <p>{t('contactDescription')}</p>
            </div>
            <div className="business-facts" aria-label={t('businessInfoLabel')}>
              <div className="business-fact">
                <span className="contact-icon"><Globe2 size={20} aria-hidden="true" /></span>
                <span className="business-fact-copy"><strong>{t('shippingLabel')}</strong><small>{t('shippingWorldwide')}</small></span>
              </div>
              <div className="business-fact">
                <span className="contact-icon"><Clock3 size={20} aria-hidden="true" /></span>
                <span className="business-fact-copy"><strong>{t('officeHoursLabel')}</strong><small>{t('officeHoursValue')}</small></span>
              </div>
            </div>
            <div className="contact-grid">
              <a className="contact-card contact-card-primary" href={site.whatsappUrl} target="_blank" rel="noreferrer">
                <span className="contact-icon"><MessageCircle size={20} aria-hidden="true" /></span><span className="contact-card-copy"><strong>{t('whatsappContact')}</strong><small>{site.whatsappDisplayNumber}</small></span><ArrowUpRight size={17} aria-hidden="true" />
              </a>
              <a className="contact-card" href={site.whatsappGroupUrl} target="_blank" rel="noreferrer">
                <span className="contact-icon whatsapp-brand-icon"><SiWhatsapp size={20} aria-hidden="true" /></span><span className="contact-card-copy"><strong>{t('whatsappGroupContact')}</strong><small>{t('whatsappGroupDetail')}</small></span><ArrowUpRight size={17} aria-hidden="true" />
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
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="page-width final-cta-inner">
            <div><p className="eyebrow"><span className="eyebrow-mark" />{t('heroEyebrow')}</p><h2>{t('finalTitle')}</h2><p>{t('finalDescription')}</p></div>
            <a className="button button-gold" href={site.whatsappUrl} target="_blank" rel="noreferrer">{t('finalButton')} <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-width footer-main">
          <div className="footer-brand-block">
            <a className="brand footer-brand" href="#home"><img src="/assets/brand/awlad-gamal-logo-transparent.webp" width="54" height="54" alt={t('logoAlt')} loading="lazy" /><span className="brand-copy"><strong>{site.brandName}</strong><small>{site.brandNameArabic}</small></span></a>
            <p>{t('footerAddress')}</p>
          </div>
          <div className="footer-column"><h3>{t('footerNavigate')}</h3>{navLinks.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}</div>
          <div className="footer-column"><h3>{t('footerContact')}</h3><a href={site.whatsappUrl} target="_blank" rel="noreferrer">{t('whatsappContact')}</a><a href={site.whatsappGroupUrl} target="_blank" rel="noreferrer">{t('whatsappGroupContact')}</a><a href={site.facebookUrl} target="_blank" rel="noreferrer">{t('facebookContact')}</a><a href={site.telegramUrl} target="_blank" rel="noreferrer">{t('telegramContact')}</a><a href={site.googleMapsUrl} target="_blank" rel="noreferrer">{t('mapsButton')}</a></div>
        </div>
        <div className="page-width footer-bottom"><span>© {currentYear} {site.brandName}. {t('copyright')}</span><span>{t('footerLocation')}</span></div>
      </footer>

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
            <button className="clear-button" type="button" onClick={() => setInquiry({})} disabled={!selectedCount}>{t('clearInquiry')}</button>
          </>}
          <div className="drawer-footer"><a className="button button-gold drawer-send" href={whatsappHref()} target="_blank" rel="noreferrer"><MessageCircle size={18} aria-hidden="true" />{selectedCount ? t('sendInquiry') : t('generalInquiry')}</a></div>
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

function SocialRail({ t }: { t: Translate }) {
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
