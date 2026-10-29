import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ImagePlus,
  LogOut,
  Play,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import type { Language } from '../i18n/translations'
import type { Product } from '../data/products'
import { isFacebookVideoUrl, type SiteContent, type SiteSettings, type TranslationKey } from '../data/site-content'
import '../Admin.css'

type Props = {
  siteContent: SiteContent
  onSaved: (content: SiteContent) => void
}

type AdminTab = 'overview' | 'products' | 'videos' | 'links' | 'copy'

const languageNames: Record<Language, string> = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
}

const siteFields: { key: keyof SiteSettings; label: string; group: 'brand' | 'links' | 'address' }[] = [
  { key: 'brandName', label: 'اسم العلامة بالإنجليزية', group: 'brand' },
  { key: 'brandNameArabic', label: 'اسم العلامة بالعربية', group: 'brand' },
  { key: 'brandLogoUrl', label: 'رابط الشعار', group: 'brand' },
  { key: 'whatsappDisplayNumber', label: 'رقم واتساب الظاهر', group: 'links' },
  { key: 'whatsappUrl', label: 'رابط واتساب المباشر', group: 'links' },
  { key: 'whatsappGroupUrl', label: 'رابط مجموعة واتساب', group: 'links' },
  { key: 'facebookUrl', label: 'رابط فيسبوك', group: 'links' },
  { key: 'telegramUrl', label: 'رابط تليجرام', group: 'links' },
  { key: 'googleMapsUrl', label: 'رابط خرائط Google', group: 'links' },
  { key: 'addressArabic', label: 'العنوان بالعربية', group: 'address' },
  { key: 'addressEnglish', label: 'العنوان بالإنجليزية', group: 'address' },
  { key: 'addressFrench', label: 'العنوان بالفرنسية', group: 'address' },
]

function messageFrom(response: Response, body: unknown): string {
  if (
    body !== null &&
    typeof body === 'object' &&
    'message' in body &&
    typeof body.message === 'string'
  ) {
    return body.message
  }
  return response.ok ? 'تعذر إتمام العملية.' : `تعذر إتمام العملية (${response.status}).`
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    throw new Error('استجابة الخادم غير صالحة.')
  }
}

async function getImageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة من جهازك.'))
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('تعذر قراءة الصورة من جهازك.'))
    }
    reader.readAsDataURL(file)
  })
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const imageUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('ملف الصورة غير صالح.'))
    })
    image.src = imageUrl
    await loaded
    return { width: image.naturalWidth, height: image.naturalHeight }
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

function translationLabel(key: TranslationKey): string {
  return key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)
}

export default function AdminPortal({ siteContent, onSaved }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingSession, setCheckingSession] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState<AdminTab>('overview')
  const [draft, setDraft] = useState<SiteContent>(() => structuredClone(siteContent))
  const [language, setLanguage] = useState<Language>('ar')
  const [copySearch, setCopySearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingProduct, setUploadingProduct] = useState<string | null>(null)
  const [newModelCode, setNewModelCode] = useState('')
  const [newModelCategory, setNewModelCategory] = useState<Product['category']>('abaya')
  const [newModelFile, setNewModelFile] = useState<File | null>(null)
  const [newReviewVideoUrl, setNewReviewVideoUrl] = useState('')

  useEffect(() => {
    if (!isOpen) return
    let active = true
    fetch('/api/admin/session', { credentials: 'same-origin' })
      .then(async (response) => {
        const body = await readJson(response)
        if (!response.ok) throw new Error(messageFrom(response, body))
        return body
      })
      .then((body: unknown) => {
        if (active && body !== null && typeof body === 'object' && 'authenticated' in body) {
          setAuthenticated(body.authenticated === true)
        }
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'تعذر التحقق من جلسة الدخول.')
      })
      .finally(() => {
        if (active) setCheckingSession(false)
      })
    return () => {
      active = false
    }
  }, [isOpen])

  const filteredTranslationKeys = useMemo(() => {
    const query = copySearch.trim().toLocaleLowerCase()
    const keys = Object.keys(draft.translations[language]) as TranslationKey[]
    if (!query) return keys
    return keys.filter((key) => (
      translationLabel(key).toLocaleLowerCase().includes(query) ||
      draft.translations[language][key].toLocaleLowerCase().includes(query)
    ))
  }, [copySearch, draft.translations, language])

  const updateSiteField = (key: keyof SiteSettings, value: string) => {
    setDraft((current) => ({ ...current, site: { ...current.site, [key]: value } }))
  }

  const updateProduct = (id: string, changes: Partial<Product>) => {
    setDraft((current) => ({
      ...current,
      products: current.products.map((product) => {
        if (product.id !== id) return product
        const updated = { ...product, ...changes }
        if ('modelCode' in changes) {
          updated.modelCodeStatus = updated.modelCode ? 'verified' : 'needs-review'
        }
        return updated
      }),
    }))
  }

  const uploadProductImage = async (file: File): Promise<{ image: string; width: number; height: number }> => {
    if (file.size > 3 * 1024 * 1024) throw new Error('يجب ألا يتجاوز حجم الصورة 3 ميجابايت.')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('اختر صورة بصيغة JPG أو PNG أو WebP.')
    }

    const dimensions = await getImageDimensions(file)
    const image = await getImageDataUrl(file)
    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
    })
    const body = await readJson(response)
    if (!response.ok || body === null || typeof body !== 'object' || !('image' in body) || typeof body.image !== 'string') {
      throw new Error(messageFrom(response, body))
    }
    return { image: body.image, ...dimensions }
  }

  const handleProductImage = async (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    setError('')
    setUploadingProduct(id)
    try {
      const image = await uploadProductImage(file)
      updateProduct(id, image)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'تعذر رفع الصورة.')
    } finally {
      setUploadingProduct(null)
    }
  }

  const handleBrandLogoImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    setError('')
    setUploadingProduct('brand-logo')
    try {
      const image = await uploadProductImage(file)
      updateSiteField('brandLogoUrl', image.image)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'تعذر رفع الشعار.')
    } finally {
      setUploadingProduct(null)
    }
  }

  const addProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!newModelFile) {
      setError('اختر صورة للموديل قبل إضافته.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const image = await uploadProductImage(newModelFile)
      const modelCode = newModelCode.trim() || null
      const product: Product = {
        id: `model-${crypto.randomUUID()}`,
        ...image,
        modelCode,
        modelCodeStatus: modelCode ? 'verified' : 'needs-review',
        category: newModelCategory,
      }
      setDraft((current) => ({ ...current, products: [product, ...current.products] }))
      setNewModelCode('')
      setNewModelFile(null)
      form.reset()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'تعذر إضافة الموديل.')
    } finally {
      setSaving(false)
    }
  }

  const removeProduct = (id: string) => {
    setDraft((current) => ({
      ...current,
      products: current.products.filter((product) => product.id !== id),
    }))
  }

  const addReviewVideo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const videoUrl = newReviewVideoUrl.trim()
    if (!isFacebookVideoUrl(videoUrl)) {
      setError('أدخل رابط فيديو صالحًا من Facebook يبدأ بـ https://.')
      return
    }
    if (draft.reviewVideos.includes(videoUrl)) {
      setError('هذا الفيديو موجود بالفعل في القائمة.')
      return
    }
    if (draft.reviewVideos.length >= 50) {
      setError('يمكن إضافة 50 فيديو كحد أقصى.')
      return
    }

    setError('')
    setDraft((current) => ({ ...current, reviewVideos: [...current.reviewVideos, videoUrl] }))
    setNewReviewVideoUrl('')
  }

  const removeReviewVideo = (videoUrl: string) => {
    setDraft((current) => ({
      ...current,
      reviewVideos: current.reviewVideos.filter((video) => video !== videoUrl),
    }))
  }

  const saveChanges = async () => {
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const body = await readJson(response)
      if (!response.ok) throw new Error(messageFrom(response, body))
      const savedContent = body as SiteContent
      setDraft(structuredClone(savedContent))
      onSaved(savedContent)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'تعذر حفظ تعديلات الموقع.')
    } finally {
      setSaving(false)
    }
  }

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setCheckingSession(true)
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const body = await readJson(response)
      if (!response.ok) throw new Error(messageFrom(response, body))
      setDraft(structuredClone(siteContent))
      setPassword('')
      setAuthenticated(true)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'تعذر تسجيل الدخول.')
    } finally {
      setCheckingSession(false)
    }
  }

  const logout = async () => {
    setError('')
    try {
      const response = await fetch('/api/admin/session', {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const body = await readJson(response)
      if (!response.ok) throw new Error(messageFrom(response, body))
      setAuthenticated(false)
      setUsername('')
      setPassword('')
      setTab('overview')
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'تعذر تسجيل الخروج.')
    }
  }

  const closePanel = () => {
    setIsOpen(false)
    setError('')
    setPassword('')
  }

  const openPanel = () => {
    setError('')
    setCheckingSession(true)
    setIsOpen(true)
  }

  return (
    <>
      <div className="footer-admin-entry">
        <span>إدارة محتوى الموقع</span>
        <button type="button" onClick={openPanel}>
          <ShieldCheck size={15} aria-hidden="true" />
          دخول الإدارة
        </button>
      </div>

      {isOpen && (
        <div className="admin-overlay" dir="rtl">
          <section className={`admin-window ${authenticated ? 'admin-window-full' : ''}`} role="dialog" aria-modal="true" aria-labelledby="admin-title">
            <header className="admin-topbar">
              <a className="admin-mark" href="#home" onClick={closePanel} aria-label="العودة للموقع">
                <img src="/assets/brand/awlad-gamal-logo-transparent.webp" alt="" />
                <span><strong>أولاد جمال</strong><small>إدارة الموقع</small></span>
              </a>
              <div className="admin-topbar-actions">
                {authenticated && (
                  <button className="admin-logout" type="button" onClick={logout}>
                    <LogOut size={15} aria-hidden="true" /> تسجيل الخروج
                  </button>
                )}
                <button className="admin-close" type="button" onClick={closePanel} aria-label="إغلاق لوحة الإدارة">
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
            </header>

            {checkingSession && !authenticated ? (
              <div className="admin-loading" role="status">جارٍ التحقق من جلسة الإدارة…</div>
            ) : authenticated ? (
              <div className="admin-layout">
                <aside className="admin-sidebar">
                  <p className="admin-sidebar-label">إدارة المحتوى</p>
                  {([
                    ['overview', 'نظرة عامة'],
                    ['products', 'الموديلات'],
                    ['videos', 'فيديوهات التقييمات'],
                    ['links', 'الروابط والعنوان'],
                    ['copy', 'النصوص والترجمات'],
                  ] as const).map(([id, label]) => (
                    <button className={tab === id ? 'is-active' : ''} type="button" key={id} onClick={() => setTab(id)}>
                      <span>{label}</span><ChevronDown size={14} aria-hidden="true" />
                    </button>
                  ))}
                  <div className="admin-sidebar-foot">
                    <ShieldCheck size={17} aria-hidden="true" />
                    <span>اتصال آمن<br /><small>التعديلات تحفظ لجميع الزوار</small></span>
                  </div>
                </aside>

                <main className="admin-main">
                  <div className="admin-content-heading">
                    <div>
                      <p className="admin-kicker">لوحة التحكم · أولاد جمال</p>
                      <h1 id="admin-title">
                        {tab === 'overview' ? 'أهلاً بك في لوحة الإدارة' :
                          tab === 'products' ? 'كتالوج الموديلات' :
                            tab === 'videos' ? 'فيديوهات تقييمات العملاء' :
                            tab === 'links' ? 'بيانات التواصل والموقع' : 'محتوى الموقع'}
                      </h1>
                    </div>
                    <button className="admin-save" type="button" onClick={saveChanges} disabled={saving}>
                      {saving ? <span className="admin-spinner" /> : <Save size={16} aria-hidden="true" />}
                      {saving ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}
                    </button>
                  </div>

                  {error && <div className="admin-alert" role="alert">{error}</div>}

                  {tab === 'overview' && (
                    <div className="admin-overview">
                      <article className="admin-welcome-card">
                        <div className="admin-welcome-icon"><ShieldCheck size={23} /></div>
                        <div><h2>تحكم كامل في موقعك</h2><p>عدّل الموديلات والنصوص وروابط التواصل، ثم احفظ ليظهر التغيير لكل الزوار.</p></div>
                      </article>
                      <div className="admin-stat-grid">
                        <article><span>موديل في الكتالوج</span><strong>{draft.products.length}</strong><small>عبايات وإسدالات</small></article>
                        <article><span>فيديو تقييمات العملاء</span><strong>{draft.reviewVideos.length}</strong><small>فيديو من Facebook</small></article>
                        <article><span>لغات الموقع</span><strong>03</strong><small>العربية والإنجليزية والفرنسية</small></article>
                        <article><span>روابط التواصل</span><strong>05</strong><small>واتساب وفيسبوك وتليجرام والخرائط</small></article>
                      </div>
                      <div className="admin-quick-actions">
                        <button type="button" onClick={() => setTab('products')}><ImagePlus size={19} /><span><strong>إدارة الموديلات</strong><small>إضافة الصور أو تعديل الكتالوج</small></span><ArrowUpRight size={16} /></button>
                        <button type="button" onClick={() => setTab('videos')}><Play size={19} /><span><strong>فيديوهات تقييمات العملاء</strong><small>أضف أو احذف فيديوهات Facebook</small></span><ArrowUpRight size={16} /></button>
                        <button type="button" onClick={() => setTab('copy')}><span className="admin-quick-type">Aa</span><span><strong>تعديل النصوص</strong><small>كل النصوص باللغات الثلاث</small></span><ArrowUpRight size={16} /></button>
                        <button type="button" onClick={() => setTab('links')}><ArrowUpRight size={19} /><span><strong>تحديث بيانات التواصل</strong><small>الأرقام والعناوين والروابط</small></span><ArrowUpRight size={16} /></button>
                      </div>
                      <p className="admin-save-note"><Check size={15} /> لن تظهر أي تعديلات للزوار قبل الضغط على «حفظ التعديلات».</p>
                    </div>
                  )}

                  {tab === 'products' && (
                    <div className="admin-section-content">
                      <div className="admin-section-intro">
                        <div><h2>الموديلات الحالية</h2><p>غيّر كود الموديل أو فئته، ارفع صورة جديدة، أو احذف ما لم يعد متاحًا.</p></div>
                        <span className="admin-count">{draft.products.length} موديل</span>
                      </div>

                      <form className="admin-new-product" onSubmit={addProduct}>
                        <div className="admin-new-product-heading"><span className="admin-new-icon"><Plus size={17} /></span><div><h3>إضافة موديل جديد</h3><p>ارفع صورة واضحة بصيغة JPG أو PNG أو WebP، بحد أقصى 3 ميجابايت.</p></div></div>
                        <div className="admin-new-product-fields">
                          <label>كود الموديل<input value={newModelCode} onChange={(event) => setNewModelCode(event.target.value)} placeholder="مثال: 248" /></label>
                          <label>الفئة<select value={newModelCategory} onChange={(event) => setNewModelCategory(event.target.value as Product['category'])}><option value="abaya">عباية</option><option value="isdaal">إسدال</option></select></label>
                          <label className="admin-file-input"><ImagePlus size={16} />{newModelFile ? newModelFile.name : 'اختيار صورة'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setNewModelFile(event.currentTarget.files?.[0] ?? null)} /></label>
                          <button className="admin-add-product" type="submit" disabled={saving}><Plus size={16} /> إضافة</button>
                        </div>
                      </form>

                      <div className="admin-product-list">
                        {draft.products.map((product, index) => (
                          <article className="admin-product-row" key={product.id}>
                            <div className="admin-product-photo">
                              <img src={product.image} alt="" />
                              <label className="admin-photo-replace" title="استبدال الصورة">
                                <ImagePlus size={14} />
                                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handleProductImage(product.id, event)} />
                              </label>
                            </div>
                            <div className="admin-product-fields">
                              <label><span>كود الموديل</span><input value={product.modelCode ?? ''} onChange={(event) => updateProduct(product.id, { modelCode: event.target.value.trim() || null })} placeholder={`موديل ${index + 1}`} /></label>
                              <label><span>الفئة</span><select value={product.category} onChange={(event) => updateProduct(product.id, { category: event.target.value as Product['category'] })}><option value="abaya">عباية</option><option value="isdaal">إسدال</option></select></label>
                            </div>
                            <span className="admin-upload-status" aria-live="polite">{uploadingProduct === product.id ? 'جارٍ رفع الصورة…' : ''}</span>
                            <button className="admin-delete-product" type="button" onClick={() => removeProduct(product.id)} aria-label={`حذف الموديل ${product.modelCode ?? index + 1}`}><Trash2 size={17} /></button>
                          </article>
                        ))}
                        {draft.products.length === 0 && <p className="admin-empty">لا توجد موديلات. أضف موديلًا جديدًا من النموذج أعلاه.</p>}
                      </div>
                    </div>
                  )}

                  {tab === 'videos' && (
                    <div className="admin-section-content">
                      <div className="admin-section-intro">
                        <div><h2>فيديوهات تقييمات العملاء</h2><p>أضف رابط فيديو عام من Facebook ليظهر مضمّنًا في قسم آراء العملاء بالموقع.</p></div>
                        <span className="admin-count">{draft.reviewVideos.length} / 50 فيديو</span>
                      </div>

                      <form className="admin-new-product admin-new-review-video" onSubmit={addReviewVideo}>
                        <div className="admin-new-product-heading">
                          <span className="admin-new-icon"><Play size={17} /></span>
                          <div><h3>إضافة فيديو تقييم</h3><p>استخدم رابط فيديو أو Reel عام على Facebook، وليس رابط منشور خاص.</p></div>
                        </div>
                        <div className="admin-review-video-fields">
                          <label>رابط الفيديو على Facebook<input dir="ltr" type="url" value={newReviewVideoUrl} onChange={(event) => setNewReviewVideoUrl(event.target.value)} placeholder="https://www.facebook.com/..." required /></label>
                          <button className="admin-add-product" type="submit" disabled={saving || draft.reviewVideos.length >= 50}><Plus size={16} /> إضافة الفيديو</button>
                        </div>
                      </form>

                      <div className="admin-review-video-list">
                        {draft.reviewVideos.map((videoUrl, index) => (
                          <article className="admin-review-video-row" key={videoUrl}>
                            <span className="admin-new-icon"><Play size={16} /></span>
                            <a href={videoUrl} target="_blank" rel="noreferrer" dir="ltr">فيديو التقييم {index + 1} · Facebook</a>
                            <button className="admin-delete-product" type="button" onClick={() => removeReviewVideo(videoUrl)} aria-label={`حذف فيديو التقييم ${index + 1}`}><Trash2 size={17} /></button>
                          </article>
                        ))}
                        {draft.reviewVideos.length === 0 && <p className="admin-empty">لا توجد فيديوهات بعد. أضف رابط فيديو Facebook من النموذج أعلاه.</p>}
                      </div>
                      <p className="admin-save-note"><Check size={15} /> اضغط «حفظ التعديلات» ليظهر الفيديو للزوار. يجب أن يكون الفيديو عامًا ومسموحًا بتضمينه.</p>
                    </div>
                  )}

                  {tab === 'links' && (
                    <div className="admin-section-content">
                      <div className="admin-section-intro"><div><h2>بيانات المكتب وروابط التواصل</h2><p>حدّث رقم واتساب، الروابط الاجتماعية، الاسم والعناوين.</p></div></div>
                      {(['brand', 'links', 'address'] as const).map((group) => (
                        <section className="admin-fields-card" key={group}>
                          <h3>{group === 'brand' ? 'اسم العلامة' : group === 'links' ? 'روابط التواصل' : 'عنوان المكتب'}</h3>
                          <div className="admin-settings-grid">
                            {siteFields.filter((field) => field.group === group).map(({ key, label }) => (
                              key === 'brandLogoUrl' ? (
                                <div className="admin-brand-logo-field" key={key}>
                                  <label><span>{label}</span><input dir="ltr" value={draft.site[key]} onChange={(event) => updateSiteField(key, event.target.value)} /></label>
                                  <label className="admin-file-input"><ImagePlus size={15} />{uploadingProduct === 'brand-logo' ? 'جارٍ رفع الشعار…' : 'رفع شعار جديد'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handleBrandLogoImage(event)} /></label>
                                </div>
                              ) : (
                                <label className={key.startsWith('address') ? 'admin-field-wide' : ''} key={key}>
                                  <span>{label}</span>
                                  {key.startsWith('address') ? (
                                    <textarea rows={2} value={draft.site[key]} onChange={(event) => updateSiteField(key, event.target.value)} />
                                  ) : (
                                    <input dir={key.endsWith('Url') || key === 'whatsappDisplayNumber' ? 'ltr' : undefined} value={draft.site[key]} onChange={(event) => updateSiteField(key, event.target.value)} />
                                  )}
                                </label>
                              )
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}

                  {tab === 'copy' && (
                    <div className="admin-section-content">
                      <div className="admin-section-intro"><div><h2>النصوص والترجمات</h2><p>ابحث عن أي نص في الموقع وعدّله للغة المختارة. استخدم المتغيرات مثل <code>{'{code}'}</code> كما هي.</p></div></div>
                      <div className="admin-copy-tools">
                        <label className="admin-language-select">لغة التحرير<select value={language} onChange={(event) => setLanguage(event.target.value as Language)}><option value="ar">العربية</option><option value="en">English</option><option value="fr">Français</option></select></label>
                        <label className="admin-copy-search"><span className="sr-only">ابحث في النصوص</span><input value={copySearch} onChange={(event) => setCopySearch(event.target.value)} placeholder="ابحث باسم النص أو بمحتواه…" /></label>
                      </div>
                      <p className="admin-copy-count">عرض {filteredTranslationKeys.length} من {Object.keys(draft.translations[language]).length} نص · {languageNames[language]}</p>
                      <div className="admin-translation-list">
                        {filteredTranslationKeys.map((key) => (
                          <label className="admin-translation-field" key={key}>
                            <span>{translationLabel(key)}</span>
                            <textarea
                              dir={language === 'ar' ? 'rtl' : 'ltr'}
                              rows={draft.translations[language][key].length > 120 ? 3 : 2}
                              value={draft.translations[language][key]}
                              onChange={(event) => setDraft((current) => ({
                                ...current,
                                translations: {
                                  ...current.translations,
                                  [language]: { ...current.translations[language], [key]: event.target.value },
                                },
                              }))}
                            />
                          </label>
                        ))}
                        {filteredTranslationKeys.length === 0 && <p className="admin-empty">لا توجد نصوص تطابق بحثك.</p>}
                      </div>
                    </div>
                  )}
                </main>
              </div>
            ) : (
              <main className="admin-login-wrap">
                <div className="admin-login-card">
                  <div className="admin-login-emblem"><ShieldCheck size={25} aria-hidden="true" /></div>
                  <p className="admin-kicker">مساحة خاصة بإدارة الموقع</p>
                  <h1 id="admin-title">مرحبًا بعودتك</h1>
                  <p className="admin-login-description">سجّل الدخول للوصول إلى إعدادات ومحتوى مكتب أولاد جمال.</p>
                  <form className="admin-login-form" onSubmit={login}>
                    <label>اسم الدخول<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="اسم المستخدم" required /></label>
                    <label>كلمة المرور<input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="أدخل كلمة المرور" required /></label>
                    {error && <div className="admin-alert" role="alert">{error}</div>}
                    <button className="admin-login-submit" type="submit" disabled={checkingSession}>
                      {checkingSession ? 'جارٍ التحقق…' : 'دخول لوحة الإدارة'}
                      {!checkingSession && <ArrowUpRight size={16} aria-hidden="true" />}
                    </button>
                  </form>
                  <p className="admin-login-foot"><ShieldCheck size={13} /> اتصال مشفر · صلاحية الجلسة 8 ساعات</p>
                </div>
              </main>
            )}
          </section>
        </div>
      )}
    </>
  )
}
